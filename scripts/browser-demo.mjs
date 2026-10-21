// BROWSER-ORIGINATED end-to-end demonstration against the live ProofOfShip frontend.
// Headless Chrome drives the real UI (book commitment, back, submit proof, inspection, challenge, challenge round)
// with an injected mock EIP-1193 provider. The provider is a thin bridge: every request is forwarded to THIS Node
// process, which signs with the test wallet keys from .env (PRIVATE_KEY / PRIVATE_KEY_2). Keys never enter the page.
// Two browser contexts: builder (wallet 1) and backer (wallet 2).
// Usage: DEMO_URL=https://proofofship.vercel.app node scripts/browser-demo.mjs
// Writes deployments/browser-demo.json (tx hashes read FROM THE UI) and docs/demo-*.png (local only, not committed).
import "dotenv/config";
import { chromium } from "playwright-core";
import { privateKeyToAccount } from "viem/accounts";
import { writeFileSync, mkdirSync } from "node:fs";
import { read, RAW_PINNED, ADDRESS } from "./e2e-lib.mjs";

const URL_BASE = (process.env.DEMO_URL || "https://proofofship.vercel.app").replace(/\/$/, "");
const RPC = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
const EXPLORER = "https://explorer-studio.genlayer.com/transactions/";
const keys = { builder: process.env.PRIVATE_KEY, backer: process.env.PRIVATE_KEY_2 };
if (!keys.builder || !keys.backer) throw new Error("PRIVATE_KEY and PRIVATE_KEY_2 are required in .env");
const doc = { demo: "browser-originated workflow (mock EIP-1193 provider, two browser contexts)", site: URL_BASE, contract: ADDRESS, startedAt: new Date().toISOString(), wallets: {}, steps: [], checks: [], rpcMethodsSeenByNodeSigner: {} };
const save = () => writeFileSync(new URL("../deployments/browser-demo.json", import.meta.url), JSON.stringify(doc, null, 2) + "\n");
mkdirSync(new URL("../docs/", import.meta.url), { recursive: true });

async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}

// Node-side wallet: the page can only ask; signing happens here.
function wallet(pk, label) {
  const account = privateKeyToAccount(pk);
  doc.wallets[label] = account.address;
  return async (method, params = []) => {
    doc.rpcMethodsSeenByNodeSigner[method] = (doc.rpcMethodsSeenByNodeSigner[method] || 0) + 1;
    switch (method) {
      case "eth_requestAccounts": case "eth_accounts": return [account.address];
      case "eth_chainId": return "0xf22f";
      case "wallet_switchEthereumChain": case "wallet_addEthereumChain": return null;
      case "eth_sendTransaction": {
        const t = params[0];
        const nonce = t.nonce !== undefined ? Number(BigInt(t.nonce)) : Number(BigInt(await rpc("eth_getTransactionCount", [account.address, "pending"])));
        const raw = await account.signTransaction({
          type: "legacy", to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n, gas: BigInt(t.gas || "0x1e8480"),
          nonce, gasPrice: t.gasPrice ? BigInt(t.gasPrice) : 0n, chainId: 61999,
        });
        return rpc("eth_sendRawTransaction", [raw]);
      }
      default: return rpc(method, params);
    }
  };
}

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
async function session(label, pk) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
  const handler = wallet(pk, label);
  const page = await ctx.newPage();
  await page.exposeFunction("__posWallet", handler);
  await page.addInitScript(() => {
    window.ethereum = { isMetaMask: true, request: ({ method, params }) => window.__posWallet(method, params ?? []), on() {}, removeListener() {} };
  });
  page.on("pageerror", (e) => console.log(`[${label}] pageerror`, String(e).slice(0, 160)));
  return { label, page, ctx, address: handler && doc.wallets[label] };
}
const shot = (s, name) => s.page.screenshot({ path: new URL(`../docs/demo-${name}.png`, import.meta.url).pathname, fullPage: false }).catch(() => {});

// Waits for the UI's clerk log to report FINALIZED+verified, and reads the transaction hash from the UI.
async function uiAction(s, label, trigger) {
  const t = Date.now();
  await trigger();
  const log = s.page.locator('[data-testid="tx-log"]').first();
  await log.waitFor({ timeout: 60_000 });
  const outcome = await s.page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="tx-log"]');
    const txt = el?.textContent || "";
    if (/Finalized and verified/.test(txt)) return "OK";
    if (/Rejected:|Validators could not agree|not on-chain|Not finalized yet/.test(txt)) return "FAIL: " + txt.slice(0, 300);
    return false;
  }, null, { timeout: 25 * 60_000, polling: 3000 }).then((h) => h.jsonValue());
  const href = await log.locator('a[href*="/transactions/"]').first().getAttribute("href").catch(() => null);
  const hash = href ? href.split("/transactions/")[1] : null;
  const step = { step: label, actor: s.label, tx_from_ui: hash, explorer: hash ? EXPLORER + hash : null, ui_outcome: outcome, seconds: Math.round((Date.now() - t) / 1000) };
  doc.steps.push(step);
  console.log(`${outcome === "OK" ? "OK  " : "FAIL"} ${label} ${hash} ${step.seconds}s`);
  save();
  if (outcome !== "OK") throw new Error(`${label}: ${outcome}`);
  return hash;
}
const check = (label, pass, detail) => { doc.checks.push({ check: label, pass: !!pass, detail }); console.log(pass ? "PASS" : "FAIL", label, detail ? JSON.stringify(detail).slice(0, 200) : ""); save(); };

async function connect(s) {
  await s.page.goto(URL_BASE + "/", { waitUntil: "networkidle" });
  const btn = s.page.getByRole("button", { name: /Connect MetaMask/ });
  if (await btn.waitFor({ timeout: 6000 }).then(() => true).catch(() => false)) await btn.click();
  await s.page.getByText(/pts/).first().waitFor({ timeout: 60_000 }).catch(() => {});
}
const goto = (s, id) => s.page.goto(`${URL_BASE}/c/${id}`, { waitUntil: "networkidle" }).then(() => s.page.waitForTimeout(3000));
const get = (id) => read("get_commitment", [id]);
const CRIT = ["The tally export command writes a CSV file", "A --json flag prints the export as JSON", "The README documents installation with npm"];

try {
  const A = await session("builder", keys.builder);
  const B = await session("backer", keys.backer);
  for (const s of [A, B]) await connect(s);
  await shot(A, "01-connected");
  for (const s of [A, B]) {
    const claim = s.page.getByRole("button", { name: /^Claim .* pts$/ });
    if (await claim.waitFor({ timeout: 8000 }).then(() => true).catch(() => false)) await uiAction(s, `claim starting points (${s.label})`, () => claim.click());
  }

  // ---- book a commitment through the /new form (builder)
  const title = `Browser demo: tally CLI v1.0 #${Date.now() % 100000}`;
  const before = (await read("get_stats")).commitments;
  let id = null;
  for (let attempt = 1; attempt <= 3 && id === null; attempt++) {
    await A.page.goto(URL_BASE + "/new", { waitUntil: "networkidle" });
    await A.page.getByPlaceholder("Ship tally CLI v1.0").fill(attempt > 1 ? `${title} r${attempt}` : title);
    await A.page.getByPlaceholder(/A command line tool that exports/).fill("A command line tool called tally-cli that exports time logs to CSV and JSON, published with npm install documentation.");
    for (let i = 0; i < CRIT.length; i++) {
      if (i > 0) await A.page.getByRole("button", { name: "+ criterion" }).click();
      await A.page.locator("input.field").nth(1 + i).fill(CRIT[i]);
    }
    const sel = A.page.locator("select");
    await sel.nth(0).selectOption("RELEASE");
    await A.page.locator("input[type=number]").fill("50");
    await sel.nth(1).selectOption("3600");
    await sel.nth(2).selectOption("3600");
    await shot(A, "02-book-form");
    await uiAction(A, `book commitment (attempt ${attempt})`, () => A.page.getByRole("button", { name: /Lock & book commitment/ }).click());
    await A.page.waitForURL(/\/c\/\d+/, { timeout: 60_000 });
    id = Number(A.page.url().match(/\/c\/(\d+)/)[1]);
    const c = await get(id);
    if (c.status !== "OPEN") { console.log("refused at the gate by the AI screen:", c.reject_reason); id = null; }
  }
  if (id === null) throw new Error("commitment was refused three times");
  const booked = await get(id);
  check("UI navigated to the id returned by the create transaction receipt", booked.builder === A.address && booked.title.startsWith(title.slice(0, 30)), { navigated_to: id, count_before: before, status: booked.status });
  await shot(A, "03-booked");

  // ---- back (backer, second context)
  await goto(B, id);
  await B.page.locator("input[type=number]").fill("40");
  await uiAction(B, "back 40 pts", () => B.page.getByRole("button", { name: /^Back 40 pts$/ }).click());
  check("backing recorded on-chain", (await get(id)).backed === 40, { backed: (await get(id)).backed });

  // ---- submit proof (builder): commit-pinned release notes
  await goto(A, id);
  await A.page.getByPlaceholder(/releases\/tag\/v1.0/).fill(RAW_PINNED + "ship/release-notes.md");
  await uiAction(A, "submit proof", () => A.page.getByRole("button", { name: /Submit proof for inspection/ }).click());
  const snaps = await read("get_snapshots", [id]);
  check("proof snapshotted by consensus", snaps.length === 1 && /^[0-9a-f]{64}$/.test(snaps[0].sha256), { sha256: snaps[0]?.sha256 });

  // ---- AI inspection (builder)
  await A.page.reload({ waitUntil: "networkidle" }); await A.page.waitForTimeout(3000);
  await uiAction(A, "run inspection (AI verdict)", () => A.page.getByRole("button", { name: /Run inspection/ }).click());
  let c = await get(id);
  const r1 = (await read("get_rounds", [id]))[0];
  check("verdict stored with one structured finding per criterion", c.status === "JUDGED" && r1.findings.length === 3, { verdict: c.verdict, findings: r1.findings.map((f) => f.status) });
  await A.page.reload({ waitUntil: "networkidle" }); await A.page.waitForTimeout(3000);
  await shot(A, "04-judged");

  // ---- challenge (backer) and challenge round (backer)
  await goto(B, id);
  await B.page.getByPlaceholder(/Grounds of challenge/).fill("The proof overstates what shipped; please re-check every criterion against all sources.");
  await uiAction(B, "file challenge (bond 100)", () => B.page.getByRole("button", { name: /File challenge/ }).click());
  await B.page.reload({ waitUntil: "networkidle" }); await B.page.waitForTimeout(3000);
  await uiAction(B, "run challenge round (settlement)", () => B.page.getByRole("button", { name: /Run challenge round/ }).click());
  c = await get(id);
  check("commitment FINAL after the challenge round, settled on-chain", c.status === "FINAL", { first: c.first_verdict, final: c.verdict, challenge: c.challenge_result, bond: c.bond_note, settlement: c.settlement });
  await B.page.reload({ waitUntil: "networkidle" }); await B.page.waitForTimeout(3000);
  await shot(B, "05-final");
  doc.commitment = { id, final: c, rounds: await read("get_rounds", [id]) };
  const stored = await A.page.evaluate(() => localStorage.getItem("proofofship:txs:v1"));
  doc.uiPersistedTxRecords = JSON.parse(stored || "[]").map((r) => ({ method: r.method, state: r.state, hash: r.hash }));
  check("every UI action ended FINALIZED + verified", doc.steps.every((x) => x.ui_outcome === "OK"), doc.steps.length + " actions");
  check("private keys never present in the page", !(await A.page.content()).includes(keys.builder.slice(2, 20)) && !(await B.page.content()).includes(keys.backer.slice(2, 20)));
} catch (e) {
  console.error("DEMO FAILED:", e.message);
  doc.error = String(e.message).slice(0, 500);
  process.exitCode = 1;
} finally {
  doc.finishedAt = new Date().toISOString();
  save();
  await browser.close();
}
