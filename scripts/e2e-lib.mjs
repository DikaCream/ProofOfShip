// Shared helpers for the Studionet end-to-end runs. Actors are throwaway in-memory wallets unless a key is passed
// (Studionet is gasless). No key is ever written to disk or printed.
import { writeFileSync, readFileSync } from "node:fs";
import { createAccount, createClient, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { toPlain, waitAndInspect, parseReadable, EXPLORER_URL } from "./lib.mjs";

export const RPC = process.env.GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
export const ADDRESS = process.env.CONTRACT_ADDRESS ||
  JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url))).contractAddress;
export const RAW = "https://raw.githubusercontent.com/DikaCream/ProofOfShip/main/docs/evidence/";
// fixtures pinned to an immutable commit (used for RELEASE-type proofs)
export const PIN = "d066a4a7972827b4f21ea0a311113618e9398dab";
export const RAW_PINNED = `https://raw.githubusercontent.com/DikaCream/ProofOfShip/${PIN}/docs/evidence/`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const now = () => Math.floor(Date.now() / 1000);

export const reader = createClient({ chain: studionet, endpoint: RPC });
export const read = async (fn, args = []) => toPlain(await reader.readContract({ address: ADDRESS, functionName: fn, args }));

export const TITLE = "Ship tally CLI v1.0";
export const DELIV = "A command line tool called tally-cli that exports time logs to CSV and JSON, published with npm install documentation.";
export const CRIT = [
  "The tally export command writes a CSV file",
  "A --json flag prints the export as JSON",
  "The README documents installation with npm",
];
export const VAGUE = ["The tool feels amazing and users love it", "It becomes the best CLI of the year"];

export class Run {
  constructor(name) {
    this.name = name;
    this.doc = { scenario: name, network: "studionet", chainId: 61999, contract: ADDRESS, startedAt: new Date().toISOString(), actors: {}, steps: [], checks: [] };
    this.out = new URL(`../deployments/e2e-${name}.json`, import.meta.url);
  }
  actor(label, pk = generatePrivateKey()) {
    const account = createAccount(pk);
    const client = createClient({ chain: studionet, endpoint: RPC, account });
    this.doc.actors[label] = account.address;
    return { label, client, address: account.address };
  }
  save() { writeFileSync(this.out, JSON.stringify(this.doc, null, 2) + "\n"); }
  async write(label, who, fn, args, { expectFail = false } = {}) {
    const t = Date.now();
    let hash, out;
    try {
      hash = await who.client.writeContract({ address: ADDRESS, functionName: fn, args, value: 0n });
      out = await waitAndInspect(who.client, hash, { retries: 300, interval: 4000 });
    } catch (e) { out = { success: false, error: String(e.shortMessage || e.message).slice(0, 200) }; }
    const ok = expectFail ? out.success !== true : out.success === true;
    const values = parseReadable(out.returnValue);
    const step = { step: label, actor: who.label, method: fn, tx: hash || null, explorer: hash ? `${EXPLORER_URL}/transactions/${hash}` : null,
      status: out.statusName || "REJECTED", execution: out.executionResult || "ERROR", ok, expected: expectFail ? "revert" : "success",
      returned_id: values.id ?? null, seconds: Math.round((Date.now() - t) / 1000) };
    if (!out.success && out.stderr) step.error = String(out.stderr).split("\n").filter((l) => /Error/.test(l)).slice(-1)[0]?.slice(0, 200);
    this.doc.steps.push(step);
    console.log(`[${this.name}] ${ok ? "OK  " : "FAIL"} ${label} [${step.status}/${step.execution}] ${step.seconds}s${step.error ? " " + step.error : ""}`);
    this.save();
    return { ...out, values, step };
  }
  check(label, pass, detail) {
    this.doc.checks.push({ check: label, pass: !!pass, detail });
    console.log(`[${this.name}] ${pass ? "PASS" : "FAIL"} ${label}${detail !== undefined ? " -> " + JSON.stringify(detail).slice(0, 300) : ""}`);
    this.save();
  }
  async start(...actors) {
    for (const a of actors) {
      const u = await read("get_user", [a.address]);
      if (!u.claimed) await this.write(`claim_points (${a.label})`, a, "claim_points", []);
    }
  }
  async finalizeAll(maxMinutes = 30) {
    const deadline = Date.now() + maxMinutes * 60_000;
    for (const s of this.doc.steps) {
      if (!s.tx) continue;
      while (Date.now() < deadline) {
        const tx = await reader.getTransaction({ hash: s.tx }).catch(() => null);
        if (tx?.statusName) s.final_status = tx.statusName;
        if (tx?.statusName === "FINALIZED") break;
        await sleep(15000);
      }
    }
    this.doc.finishedAt = new Date().toISOString();
    this.doc.all_finalized = this.doc.steps.filter((s) => s.tx).every((s) => s.final_status === "FINALIZED");
    this.doc.all_checks_pass = this.doc.checks.every((c) => c.pass) && this.doc.steps.every((s) => s.ok);
    this.save();
    console.log(`[${this.name}] finalized=${this.doc.all_finalized} checks=${this.doc.all_checks_pass}`);
  }
}

// create_commitment with retries: the AI screen is non-deterministic, a dismissal of a valid commitment is retried (and recorded)
export async function createOpen(run, who, o = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const title = (o.title || TITLE) + (attempt > 1 ? ` (retry ${attempt})` : "");
    const r = await run.write(`create_commitment: ${title}`, who, "create_commitment",
      [title, o.deliv || DELIV, o.criteria || CRIT, o.kind || "REPO", o.stake ?? 100, o.dl ?? 1800, o.rw ?? 900]);
    const id = r.values.id;
    run.check("receipt returns the commitment id", Number.isInteger(id), { id });
    const c = await read("get_commitment", [id]);
    run.check(`commitment ${id} belongs to ${who.label}`, c.builder === who.address, { status: c.status, reject: c.reject_reason });
    if (c.status === "OPEN") return id;
  }
  throw new Error("valid commitment was rejected three times");
}

// judge with retries: an UNDETERMINED round reverts ("call judge again") and is retried before the deadline
export async function judgeIt(run, who, id, fn = "judge") {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await run.write(`${fn} (attempt ${attempt})`, who, fn, [id], { expectFail: false });
    if (r.success) {
      if (fn === "rule_challenge") {
        const c = await read("get_commitment", [id]);
        if (c.status === "CHALLENGED") continue; // consensus recorded an undetermined round; try again
      }
      return true;
    }
    r.step.ok = true; r.step.note = "undetermined/reverted attempt, retried"; run.save();
  }
  return false;
}

export const ledgerOk = async (run) => {
  const l = await read("get_ledger");
  run.check("points conserved: balances + escrow + pool == minted", l.conserved === true, l);
  return l;
};
