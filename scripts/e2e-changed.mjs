// On-chain scenario: PROOF PAGE CHANGED AFTER THE SNAPSHOT (page swap).
//   node scripts/e2e-changed.mjs submit   # snapshots docs/evidence/changed/proof.md (version 1: 2 of 3 criteria)
//   ... edit that file on GitHub main to version 2 (claims everything shipped), wait until raw.githubusercontent serves it ...
//   (CHANGED_FILE=<name in docs/evidence/changed/> CHANGED_RUN=<result name> select a fresh fixture for a rerun)
//   node scripts/e2e-changed.mjs judge    # validators must judge the STORED snapshot text and flag the change
// Builder/backer keys: PRIVATE_KEY / PRIVATE_KEY_2 from .env (never committed). Result: deployments/e2e-changed.json
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { Run, read, RAW, createOpen, judgeIt, ledgerOk } from "./e2e-lib.mjs";

const phase = process.argv[2];
const RUN = process.env.CHANGED_RUN || "changed", FILE = process.env.CHANGED_FILE || "proof.md";
const run = new Run(RUN);
if (phase === "judge" && existsSync(run.out)) run.doc = JSON.parse(readFileSync(run.out));
const A = run.actor("builder", process.env.PRIVATE_KEY), B = run.actor("backer", process.env.PRIVATE_KEY_2);
const URL_ = RAW + "changed/" + FILE;

if (phase === "submit") {
  await run.start(A, B);
  const id = await createOpen(run, A, { title: "Ship tally CLI v1.0 (page swap test)", rw: 3600, dl: 3600 });
  run.doc.id = id;
  await run.write("back 100 points", B, "back", [id, 100]);
  await run.write("submit_proof (version 1 page)", A, "submit_proof", [id, [URL_]]);
  const s = await read("get_snapshots", [id]);
  run.check("snapshot holds version 1 text", s.length === 1 && /version 1/.test(s[0].text) && /^[0-9a-f]{64}$/.test(s[0].sha256), { sha256: s[0]?.sha256 });
  run.doc.snapshot = s[0];
  run.save();
  console.log("Commitment", id, "submitted: now switch changed/proof.md to version 2");
} else if (phase === "judge") {
  const id = run.doc.id;
  // raw.githubusercontent edges cache for ~5 min: require version 2 on 6 consecutive fetches over ~1 min
  let live = "", streak = 0;
  for (let i = 0; i < 60 && streak < 6; i++) {
    live = await (await fetch(URL_ + "?nocache=" + Date.now())).text();
    streak = /version 2/.test(live) ? streak + 1 : 0;
    await new Promise((r) => setTimeout(r, 10000));
  }
  run.check("live page now differs from the snapshot (version 2 is live)", /version 2/.test(live), live.slice(0, 80));
  run.check("judge succeeded", await judgeIt(run, A, id));
  const c = await read("get_commitment", [id]);
  const r = (await read("get_rounds", [id]))[0];
  run.check("verdict flagged evidence_changed and lists the URL", c.evidence_changed === true && r.changed.includes(URL_), { flagged: c.evidence_changed, changed: r.changed });
  run.check("swapped page did not win: JSON criterion not MET (stored v1 says postponed)", r.findings[1].status !== "MET" && c.verdict !== "SHIPPED", { verdict: c.verdict, findings: r.findings.map((f) => [f.status, f.quote.slice(0, 60)]) });
  run.check("no quote comes from the version-2 text", r.findings.every((f) => !/version 2|everything shipped/i.test(f.quote)));
  await ledgerOk(run);
  run.doc.commitment = c; run.doc.rounds = [r];
  await run.finalizeAll();
  process.exit(run.doc.all_checks_pass ? 0 : 1);
} else console.log("usage: node scripts/e2e-changed.mjs submit|judge");
