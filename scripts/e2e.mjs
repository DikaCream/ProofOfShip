// On-chain Studionet scenarios against the deployed contract. Usage: node scripts/e2e.mjs <scenario>
//   reject       vague criteria: the AI screen rejects the commitment and takes no stake
//   shipped      RELEASE proof pinned to a commit -> SHIPPED; a backer challenges -> UPHELD (bond to pool)
//   partial      changelog shows 2 of 3 criteria -> PARTIAL; finalized after the window (half the backing to builder)
//   missed       no proof by the deadline -> finalize -> NOT_SHIPPED (MISSED_DEADLINE), stake to the backer
//   overturn     blog post -> SHIPPED; challenger adds the maintainer notice -> OVERTURNED, bond returned
//   inconclusive blog post -> SHIPPED; challenger adds a dispute note -> challenge INCONCLUSIVE, first verdict stands
//   uncompleted  challenge nobody pursues -> rule_challenge after deadline reverts, finalize: first verdict stands, bond forfeited
//   overlap      proof .../report, challenge source .../report-final#frag: both distinct sources reach round two
//   concurrent   four wallets create at the same time: each learns its own distinct id from its own receipt
// Writes deployments/e2e-<scenario>.json (tx hashes, observed outcomes, FINALIZED confirmation).
import { Run, read, now, sleep, RAW, RAW_PINNED, VAGUE, createOpen, judgeIt, ledgerOk } from "./e2e-lib.mjs";

const name = process.argv[2];
const run = new Run(name);
const A = run.actor("builder"), B = run.actor("backer");
const get = (id) => read("get_commitment", [id]);
const bal = async (a) => (await read("get_user", [a.address])).balance;
const rep = async (a) => (await read("get_user", [a.address])).reputation;
const waitUntil = async (ts) => { const w = ts - now() + 8; if (w > 0) { console.log(`[${name}] waiting ${w}s`); await sleep(w * 1000); } };
const GROUNDS = "The proof overstates what shipped; please re-check every criterion against all sources.";

async function judgedWith(urls, o = {}) {
  const id = await createOpen(run, A, o);
  await run.write("back 200 points", B, "back", [id, 200]);
  await run.write("submit_proof", A, "submit_proof", [id, urls]);
  const snaps = await read("get_snapshots", [id]);
  run.check("proof snapshotted (sha256 + full stored text + truncation flag)", snaps.length === urls.length && snaps.every((s) => /^[0-9a-f]{64}$/.test(s.sha256) && s.text.length > 0 && s.truncated === false), snaps.map((s) => ({ url: s.url.slice(-40), sha256: s.sha256.slice(0, 12), immutable: s.immutable })));
  run.check("judge succeeded", await judgeIt(run, A, id));
  const c = await get(id);
  const r = (await read("get_rounds", [id]))[0];
  run.check("structured per-criterion findings stored (one per locked criterion, MET carries a verbatim quote)",
    r.findings.length === 3 && r.findings.every((f, i) => f.criterion === i && (f.status !== "MET" || f.quote.length >= 8)), r.findings.map((f) => [f.status, f.quote.slice(0, 50)]));
  console.log(`[${name}] first verdict ${c.verdict}`);
  return { id, c };
}

await run.start(A, B);
const start = { A: await bal(A), B: await bal(B) };

if (name === "reject") {
  const r = await run.write("create_commitment with vague criteria", A, "create_commitment",
    ["Make the best app ever", "An app that people will really enjoy using a lot and talk about everywhere.", VAGUE, "DEMO", 100, 1800, 900]);
  const c = await get(r.values.id);
  run.check("AI screen REJECTED the commitment", c.status === "REJECTED", { status: c.status, reason: c.reject_reason });
  run.check("no stake taken", (await bal(A)) === start.A && c.stake === 0, { before: start.A, after: await bal(A) });
  run.check("no reputation entry for a rejected commitment", (await rep(A)).commitments === 0);
  await run.write("submit_proof on a rejected commitment reverts", A, "submit_proof", [r.values.id, [RAW + "ship/readme.md"]], { expectFail: true });
} else if (name === "shipped") {
  const { id, c } = await judgedWith([RAW_PINNED + "ship/release-notes.md", RAW_PINNED + "ship/readme.md"], { kind: "RELEASE", title: "Ship tally CLI v1.0 (pinned release)" });
  run.check("expected scenario: SHIPPED", c.verdict === "SHIPPED", c.verdict);
  run.check("pinned raw URLs flagged immutable", (await read("get_snapshots", [id])).every((s) => s.immutable));
  await run.write("builder cannot challenge own SHIPPED verdict", A, "challenge", [id, GROUNDS, ""], { expectFail: true });
  await run.write("backer challenges (no new source)", B, "challenge", [id, GROUNDS, ""]);
  run.check("rule_challenge succeeded", await judgeIt(run, A, id, "rule_challenge"));
  const f = await get(id);
  run.check("expected scenario: challenge UPHELD, bond FORFEITED to the pool", f.status === "FINAL" && f.challenge_result === "UPHELD" && f.bond_note === "FORFEITED", { result: f.challenge_result, bond: f.bond_note, verdict: f.verdict });
  const dA = (await bal(A)) - start.A, dB = (await bal(B)) - start.B;
  run.check("SHIPPED payout: builder +200 bounty (stake back), backer -200 -100 bond", dA === 200 && dB === -300, { dA, dB });
  const r = await rep(A);
  run.check("reputation: shipped 1, streak 1, ship rate 100%", r.shipped === 1 && r.streak === 1 && r.ship_rate_bps === 10000, r);
} else if (name === "partial") {
  const { id, c } = await judgedWith([RAW + "partial/changelog.md"], { rw: 60 });
  run.check("expected scenario: PARTIAL", c.verdict === "PARTIAL", c.verdict);
  await waitUntil(c.challenge_ends);
  await run.write("finalize after the challenge window (anyone)", B, "finalize", [id]);
  const f = await get(id);
  const dA = (await bal(A)) - start.A, dB = (await bal(B)) - start.B;
  run.check("FINAL with the first verdict", f.status === "FINAL" && f.verdict === c.verdict, { verdict: f.verdict, settlement: f.settlement });
  if (f.verdict === "PARTIAL") run.check("PARTIAL payout: builder stake back + half the backing (+100), backer -100", dA === 100 && dB === -100, { dA, dB });
  const r = await rep(A);
  run.check("reputation updated: partial 1, streak 0, ship rate 50%", r.partial === 1 && r.streak === 0 && r.ship_rate_bps === 5000, r);
} else if (name === "missed") {
  const id = await createOpen(run, A, { dl: 240, rw: 60, title: "Ship tally CLI v1.0 (will miss)" });
  await run.write("back 150 points", B, "back", [id, 150]);
  let c = await get(id);
  await run.write("finalize before the deadline reverts", B, "finalize", [id], { expectFail: true });
  await waitUntil(c.deadline);
  await run.write("submit_proof after the deadline reverts", A, "submit_proof", [id, [RAW + "ship/readme.md"]], { expectFail: true });
  await run.write("finalize (anyone): no proof = NOT_SHIPPED", B, "finalize", [id]);
  c = await get(id);
  run.check("NOT_SHIPPED automatically (MISSED_DEADLINE)", c.status === "FINAL" && c.verdict === "NOT_SHIPPED" && c.outcome === "MISSED_DEADLINE", { verdict: c.verdict, outcome: c.outcome, settlement: c.settlement });
  const dA = (await bal(A)) - start.A, dB = (await bal(B)) - start.B;
  run.check("stake goes to the backer: builder -100, backer +100", dA === -100 && dB === 100, { dA, dB });
  const r = await rep(A);
  run.check("reputation: not_shipped 1, missed 1, ship rate 0", r.not_shipped === 1 && r.missed === 1 && r.ship_rate_bps === 0, r);
} else if (name === "overturn" || name === "inconclusive") {
  const { id, c } = await judgedWith([RAW + "overturn/announcement.md"], { title: `Ship tally CLI v1.0 (${name})` });
  const extra = name === "overturn" ? RAW + "overturn/maintainer-notice.md#correction" : RAW + "inconclusive/dispute-note.md";
  await run.write(`backer challenges with ${extra.split("/evidence/")[1]}`, B, "challenge", [id, "An official notice says the JSON flag did not ship in 1.0.0; the blog post is not authoritative.", extra]);
  const mid = await get(id);
  run.check("challenge source stored canonically (fragment stripped)", mid.challenge_url === extra.split("#")[0], mid.challenge_url);
  run.check("rule_challenge succeeded", await judgeIt(run, A, id, "rule_challenge"));
  const f = await get(id);
  const rounds = await read("get_rounds", [id]);
  run.check("both rounds recorded, challenge source reached round two", rounds.length === 2 && rounds[1].sources.includes(extra.split("#")[0]), rounds.map((r) => r.kind + ":" + r.verdict));
  const dB = (await bal(B)) - start.B;
  if (name === "overturn") {
    run.check("expected scenario: OVERTURNED, bond RETURNED", f.challenge_result === "OVERTURNED" && f.bond_note === "RETURNED" && f.verdict !== f.first_verdict, { first: f.first_verdict, final: f.verdict, result: f.challenge_result });
    run.check("criterion 1 (JSON flag) NOT_MET in round two", rounds[1].findings[1].status === "NOT_MET", rounds[1].findings[1]);
  } else {
    run.check("expected scenario: challenge INCONCLUSIVE, first verdict stands, bond RETURNED", f.challenge_result === "INCONCLUSIVE" && f.verdict === f.first_verdict && f.bond_note === "RETURNED", { first: f.first_verdict, final: f.verdict, result: f.challenge_result, round2: rounds[1].findings.map((x) => x.status) });
  }
  run.doc.balanceDelta = { A: (await bal(A)) - start.A, B: dB };
  run.doc.reputation = await rep(A);
} else if (name === "uncompleted") {
  const { id, c } = await judgedWith([RAW + "ship/readme.md", RAW + "partial/changelog.md"], { rw: 60, title: "Ship tally CLI v1.0 (uncompleted challenge)" });
  await run.write("backer challenges, then nobody runs rule_challenge", B, "challenge", [id, GROUNDS, ""]);
  const mid = await get(id);
  await waitUntil(mid.challenge_due);
  await run.write("rule_challenge after the deadline reverts", A, "rule_challenge", [id], { expectFail: true });
  await run.write("finalize (anyone applies the finality rules)", A, "finalize", [id]);
  const f = await get(id);
  run.check("first verdict stands, challenge UNRESOLVED, bond FORFEITED", f.status === "FINAL" && f.verdict === c.verdict && f.challenge_result === "UNRESOLVED" && f.bond_note === "FORFEITED", { first: c.verdict, final: f.verdict, result: f.challenge_result, bond: f.bond_note });
  run.doc.balanceDelta = { A: (await bal(A)) - start.A, B: (await bal(B)) - start.B };
} else if (name === "overlap") {
  const REPORT = RAW + "overlap/report", FINAL = RAW + "overlap/report-final";
  const { id } = await judgedWith([REPORT], { title: "Ship tally CLI v1.0 (overlap)" });
  await run.write("challenge adds .../report-final#frag (path overlaps .../report)", B, "challenge", [id, "The final report is a separate document and must be read too.", FINAL + "#final"]);
  const mid = await get(id);
  run.check("overlapping path stored as its own source, fragment stripped", mid.challenge_url === FINAL, mid.challenge_url);
  const snaps = await read("get_snapshots", [id]);
  run.check("two distinct snapshots (report, report-final)", snaps.length === 2 && snaps[0].url === REPORT && snaps[1].url === FINAL && snaps[0].sha256 !== snaps[1].sha256, snaps.map((s) => [s.who, s.url.slice(-14)]));
  run.check("rule_challenge succeeded", await judgeIt(run, A, id, "rule_challenge"));
  const rounds = await read("get_rounds", [id]);
  run.check("round two sources contain report AND report-final", rounds[1].sources.length === 2 && rounds[1].sources.includes(REPORT) && rounds[1].sources.includes(FINAL), rounds[1].sources);
  run.check("FINAL", (await get(id)).status === "FINAL");
} else if (name === "concurrent") {
  const C = run.actor("C"), D = run.actor("D");
  await run.start(C, D);
  const before = (await read("get_stats")).commitments;
  const who = [A, B, C, D];
  const res = await Promise.all(who.map((w) => run.write(`concurrent create (${w.label})`, w, "create_commitment",
    [`Concurrent ship ${w.label}-${Date.now() % 100000}`, "A command line tool called tally-cli that exports time logs to CSV and JSON, published with npm docs.", ["The tally export command writes a CSV file", "The README documents installation with npm"], "REPO", 20, 1800, 900])));
  const ids = res.map((r) => r.values.id);
  run.check("every creation returned an id from its own receipt", ids.every(Number.isInteger), ids);
  run.check("ids are distinct", new Set(ids).size === 4, ids);
  run.check("ids are fresh (>= count before the burst)", ids.every((i) => i >= before), { before, ids });
  for (let i = 0; i < 4; i++) {
    const c = await get(ids[i]);
    const mine = (await read("get_builder_commitments", [who[i].address, 0, 1])).items[0];
    run.check(`${who[i].label}: id ${ids[i]} is its own commitment and its newest`, c.builder === who[i].address && c.title.includes(`ship ${who[i].label}-`) && mine?.id === ids[i], { id: ids[i] });
  }
} else throw new Error("unknown scenario " + name);

await ledgerOk(run);
run.doc.stats = await read("get_stats");
run.save();
await run.finalizeAll();
process.exit(run.doc.all_checks_pass && run.doc.all_finalized ? 0 : 1);
