// Typed wrapper around the ProofOfShip intelligent contract (genlayer-js 1.1.8).
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { TransactionHash } from "genlayer-js/types";
import { CHAIN_ID, CONTRACT_ADDRESS, RPC_URL } from "./config";
import { ensureCorrectChain, type EthereumProvider } from "./wallet";

export type Status = "REJECTED" | "OPEN" | "PROOF_SUBMITTED" | "JUDGED" | "CHALLENGED" | "FINAL" | "VOID";
export type Verdict = "" | "SHIPPED" | "PARTIAL" | "NOT_SHIPPED" | "INCONCLUSIVE";
export const STATUSES: Status[] = ["OPEN", "PROOF_SUBMITTED", "JUDGED", "CHALLENGED", "FINAL", "VOID", "REJECTED"];

export interface Summary {
  id: number;
  builder: string;
  title: string;
  proof_type: "REPO" | "RELEASE" | "DEMO";
  stake: number;
  backed: number;
  status: Status;
  verdict: Verdict;
  outcome: string;
  challenge_result: "" | "OVERTURNED" | "UPHELD" | "INCONCLUSIVE" | "UNRESOLVED";
  created_at: number;
  deadline: number;
  final_at: number;
  criteria_count: number;
}

export interface Page<T = Summary> {
  total: number;
  items: T[];
  next_offset: number;
  limit?: number;
}

export interface Commitment extends Summary {
  deliverable: string;
  criteria: string[];
  reject_reason: string;
  back_until: number;
  review_window: number;
  backing_open: boolean;
  proof_urls: string[];
  proof_at: number;
  judge_due: number;
  first_verdict: Verdict;
  verdict_at: number;
  challenge_ends: number;
  challenge_open: boolean;
  challenger: string;
  challenge_grounds: string;
  challenge_url: string;
  challenged_at: number;
  challenge_due: number;
  challenge_attempts: number;
  challenge_undetermined: number;
  bond_note: "" | "RETURNED" | "FORFEITED" | "SPLIT";
  evidence_changed: boolean;
  settlement: string;
  backers: number;
  rounds: number;
  now: number;
}

export interface Finding {
  criterion: number;
  source: number;
  url: string;
  quote: string;
  fact: string;
  status: "MET" | "NOT_MET" | "UNCLEAR";
}

export interface Round {
  kind: "INITIAL" | "CHALLENGE" | "CHALLENGE_UNDETERMINED" | "AUTO";
  verdict: string;
  findings: Finding[];
  reasoning: string;
  sources: string[];
  changed: string[];
  incomplete: string[];
  caller: string;
  timestamp: number;
}

export interface Snapshot { who: string; url: string; sha256: string; text: string; truncated: boolean; immutable: boolean }
export interface Backer { backer: string; amount: number; at: number }

export interface Reputation {
  commitments: number;
  shipped: number;
  partial: number;
  not_shipped: number;
  missed: number;
  inconclusive: number;
  streak: number;
  best_streak: number;
  judged: number;
  ship_rate_bps: number;
  score: number;
}
export interface BuilderRow extends Reputation { builder: string }

export interface UserInfo { address: string; balance: number; claimed: boolean; built: number; backed: number; reputation: Reputation }

export interface Stats {
  commitments: number;
  by_status: Record<Status, number>;
  builders: number;
  users: number;
  minted: number;
  escrow: number;
  pool: number;
}

export function toPlain(value: unknown): any {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = toPlain(v);
    return obj;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && (value as object).constructor === Object) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) obj[k] = toPlain(v);
    return obj;
  }
  return value;
}

function requireAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
  return CONTRACT_ADDRESS;
}

const readClient = createClient({ chain: studionet, endpoint: RPC_URL });

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const result = await readClient.readContract({ address: requireAddress(), functionName, args });
  return toPlain(result) as T;
}

export const getCommitments = (status: string, offset: number, limit: number) => read<Page>("get_commitments", [status, offset, limit]);
export const getBuilderCommitments = (b: string, offset: number, limit: number) => read<Page>("get_builder_commitments", [b, offset, limit]);
export const getBackerCommitments = (b: string, offset: number, limit: number) => read<Page>("get_backer_commitments", [b, offset, limit]);
export const getBuilders = (offset: number, limit: number) => read<Page<BuilderRow>>("get_builders", [offset, limit]);
export const getCommitment = (id: number) => read<Commitment>("get_commitment", [id]);
export const getRounds = (id: number) => read<Round[]>("get_rounds", [id]);
export const getSnapshots = (id: number) => read<Snapshot[]>("get_snapshots", [id]);
export const getBackers = (id: number) => read<Backer[]>("get_backers", [id]);
export const getUser = (user: string) => read<UserInfo>("get_user", [user]);
export const getStats = () => read<Stats>("get_stats");
export const getLedger = () => read<{ balances: number; escrow: number; pool: number; minted: number; conserved: boolean }>("get_ledger");

// ------------------------------------------------------------------ transactions
/** Consensus steps shown in the UI, in order (from the transaction's statusName). */
export const TX_STEPS = ["PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED", "FINALIZED"] as const;
export const FAILED_STATUSES = new Set(["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT", "VALIDATORS_TIMEOUT"]);
const FINALIZE_WAIT_MS = 25 * 60_000;

export interface TxCallbacks {
  onHash?: (hash: string) => void;
  onStatus?: (status: string) => void;
}

export interface TxResult {
  hash: string;
  statusName: string;
  values: Record<string, unknown>;
}

/** Called once the transaction is FINALIZED and successful: read the contract and return null if the
 *  expected state change is really there, or a message describing what is wrong. */
export type Verifier = (r: TxResult) => Promise<string | null>;

export interface TxOptions {
  /** Idempotency key: one in-flight transaction per key (e.g. "back:3"). */
  key?: string;
  verify?: Verifier;
}

export class TxError extends Error {
  hash?: string;
  constructor(message: string, hash?: string) {
    super(message);
    this.hash = hash;
  }
}

/** Studio's "readable" return payload is JSON-like but may omit commas; extract scalar fields. */
export function parseReadable(readable: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof readable !== "string") return out;
  for (const m of readable.matchAll(/"(\w+)"\s*:\s*("(?:[^"\\]|\\.)*"|-?\d+|true|false)/g)) {
    const raw = m[2];
    try {
      out[m[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw === "true" ? true : raw === "false" ? false : Number(raw);
    } catch {
      out[m[1]] = raw.slice(1, -1);
    }
  }
  return out;
}

function cleanError(raw: unknown): string {
  const text = String(raw ?? "").trim();
  if (!text) return "The contract rejected the transaction";
  const quoted = text.match(/"([^"]{3,200})"/);
  return (quoted ? quoted[1] : text).slice(0, 200);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTx(hash: string): Promise<any | null> {
  try {
    return await readClient.getTransaction({ hash: hash as TransactionHash });
  } catch {
    return null;
  }
}

// ---- persisted transaction records (localStorage) -------------------------------------------

export type TxRecordState = "SUBMITTED" | "ACCEPTED" | "CONFIRMED" | "FAILED" | "UNVERIFIED" | "UNCERTAIN";
export interface TxRecord {
  hash: string;
  key: string;
  method: string;
  author: string;
  state: TxRecordState;
  at: number;
  note?: string;
}
const STORE = "proofofship:txs:v1";

export function loadTxRecords(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE) || "[]") as TxRecord[];
  } catch {
    return [];
  }
}
function saveTxRecord(rec: TxRecord) {
  if (typeof window === "undefined") return;
  const all = loadTxRecords().filter((r) => r.hash !== rec.hash);
  all.unshift(rec);
  window.localStorage.setItem(STORE, JSON.stringify(all.slice(0, 50)));
  window.dispatchEvent(new Event("proofofship:txs"));
}
export function dismissTxRecord(hash: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE, JSON.stringify(loadTxRecords().filter((r) => r.hash !== hash)));
  window.dispatchEvent(new Event("proofofship:txs"));
}
/** A record that is still unresolved (so the same operation must not be signed a second time). */
export function pendingRecord(key: string, author: string): TxRecord | undefined {
  return loadTxRecords().find(
    (r) => r.key === key && r.author.toLowerCase() === author.toLowerCase() &&
      (r.state === "SUBMITTED" || r.state === "ACCEPTED" || r.state === "UNCERTAIN") && Date.now() - r.at < 60 * 60_000,
  );
}

// ---- wallet revalidation --------------------------------------------------------------------

/** Immediately before signing: the wallet's ACTIVE account must still be `author` and the chain must be 61999. */
async function revalidateWallet(author: string, provider: EthereumProvider) {
  let chain = parseInt(await provider.request({ method: "eth_chainId" }), 16);
  if (chain !== CHAIN_ID) {
    await ensureCorrectChain();
    chain = parseInt(await provider.request({ method: "eth_chainId" }), 16);
  }
  if (chain !== CHAIN_ID) throw new TxError(`Wrong network (chain ${chain}). Switch your wallet to GenLayer Studionet (${CHAIN_ID}) and retry.`);
  const accounts: string[] = await provider.request({ method: "eth_accounts" });
  if (!accounts[0] || accounts[0].toLowerCase() !== author.toLowerCase()) {
    throw new TxError("The active wallet account changed. Reconnect with the account you started with and retry.");
  }
}

/**
 * Polls a submitted transaction until it is FINALIZED (the only authoritative success), checks the leader
 * receipt, then lets `verify` confirm the resulting contract state. ACCEPTED is shown but is NOT success.
 */
export async function watchTx(
  hash: string, rec: TxRecord, cb: TxCallbacks, verify?: Verifier,
): Promise<TxResult> {
  let status = "PENDING";
  let tx: any = null;
  const deadline = Date.now() + FINALIZE_WAIT_MS;
  while (Date.now() < deadline) {
    await sleep(2500);
    const next = await fetchTx(hash);
    if (!next) continue;
    tx = next;
    const s = String(tx.statusName ?? status);
    if (s !== status) {
      status = s;
      cb.onStatus?.(s);
      if (s === "ACCEPTED") saveTxRecord({ ...rec, state: "ACCEPTED", at: Date.now() });
    }
    const receipts = tx?.consensus_data?.leader_receipt;
    const leader = Array.isArray(receipts) ? receipts[0] : receipts;
    if (FAILED_STATUSES.has(s)) {
      saveTxRecord({ ...rec, state: "FAILED", note: s, at: Date.now() });
      throw new TxError(`Validators could not agree (status: ${s}). Nothing was recorded.`, hash);
    }
    if (leader?.execution_result && leader.execution_result !== "SUCCESS") {
      saveTxRecord({ ...rec, state: "FAILED", note: "execution error", at: Date.now() });
      throw new TxError(cleanError(leader?.result?.payload?.readable || leader?.genvm_result?.stderr), hash);
    }
    if (s === "FINALIZED") break;
  }
  if (status !== "FINALIZED") {
    saveTxRecord({ ...rec, state: "UNCERTAIN", note: `still ${status} after ${FINALIZE_WAIT_MS / 60000} min`, at: Date.now() });
    throw new TxError(
      `Not finalized yet (${status.toLowerCase()}). The transaction may still complete: its hash is saved on this device, check the explorer or reopen this page later. Do not resubmit.`,
      hash,
    );
  }
  const receipts = tx?.consensus_data?.leader_receipt;
  const leader = Array.isArray(receipts) ? receipts[0] : receipts;
  const result: TxResult = { hash, statusName: status, values: parseReadable(leader?.result?.payload?.readable) };
  if (verify) {
    let problem: string | null;
    try {
      problem = await verify(result);
    } catch (e: any) {
      problem = `could not read the contract to confirm (${String(e?.message ?? e).slice(0, 80)})`;
    }
    if (problem) {
      saveTxRecord({ ...rec, state: "UNVERIFIED", note: problem, at: Date.now() });
      throw new TxError(`The transaction finalized but the expected result is not on-chain: ${problem}`, hash);
    }
  }
  saveTxRecord({ ...rec, state: "CONFIRMED", at: Date.now() });
  return result;
}

/**
 * Sends a write through the wallet and reports success only when it is FINALIZED and the contract state
 * verifies. Guards: wallet account + chain are re-checked right before signing; one in-flight transaction per
 * key (a repeat call resumes watching the saved hash instead of signing again); the hash is persisted at once.
 */
export async function sendTx(
  author: `0x${string}`,
  provider: EthereumProvider,
  functionName: string,
  args: unknown[],
  cb: TxCallbacks = {},
  opts: TxOptions = {},
): Promise<TxResult> {
  const address = requireAddress();
  const key = opts.key ?? functionName;
  const existing = pendingRecord(key, author);
  if (existing) {
    cb.onHash?.(existing.hash);
    cb.onStatus?.(existing.state === "ACCEPTED" ? "ACCEPTED" : "PENDING");
    return watchTx(existing.hash, existing, cb, opts.verify);
  }
  await revalidateWallet(author, provider);
  const writeClient = createClient({ chain: studionet, endpoint: RPC_URL, account: author, provider: provider as any });
  const hash: string = await writeClient.writeContract({ address, functionName, args: args as any, value: BigInt(0) });
  const rec: TxRecord = { hash, key, method: functionName, author, state: "SUBMITTED", at: Date.now() };
  saveTxRecord(rec); // preserved immediately: a reload mid-flight can resume instead of re-signing
  cb.onHash?.(hash);
  cb.onStatus?.("PENDING");
  return watchTx(hash, rec, cb, opts.verify);
}

// ---- state verifiers (what must be true on-chain once each write finalized) -----------------

export const verifiers = {
  /** create_commitment: the id comes from this transaction's own return value and is checked against contract state. */
  async created(me: string, title: string, r: TxResult): Promise<string | null> {
    const id = Number(r.values.id);
    if (!Number.isInteger(id)) return "the receipt carries no commitment id";
    const c = await getCommitment(id);
    if (c.builder.toLowerCase() !== me.toLowerCase() || c.title !== title.split(/\s+/).join(" ")) return `commitment ${id} is not this one`;
    return null;
  },
  async status(id: number, ok: Status[]): Promise<string | null> {
    const c = await getCommitment(id);
    return ok.includes(c.status) ? null : `commitment ${id} is ${c.status}, expected ${ok.join(" or ")}`;
  },
};
