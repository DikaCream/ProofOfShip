"use client";

import { FAILED_STATUSES, TX_STEPS } from "@/lib/pos";
import { txExplorerUrl } from "@/lib/config";
import { verdictClass, verdictText, STATUS_LABEL } from "@/lib/ui";
import type { Status } from "@/lib/pos";

export const manifestNo = (id: number) => `POS-${String(id).padStart(5, "0")}`;

/** Split-flap countdown (T-minus) like a departure board. */
export function Flaps({ seconds, done = "DEPARTED" }: { seconds: number; done?: string }) {
  if (seconds <= 0) return <span className="mono text-[13px] font-semibold tracking-widest">{done}</span>;
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  const txt = d > 0 ? `${d}D ${p(h)}H` : `${p(h)}:${p(m)}:${p(s)}`;
  return (
    <span aria-label={`T-minus ${txt}`} className="whitespace-nowrap">
      <span className="mr-1 mono text-[11px] opacity-70">T-</span>
      {txt.split("").map((ch, i) => (ch === " " || ch === ":" ? <span key={i} className="mx-0.5 mono">{ch}</span> : <span key={i} className="flap">{ch}</span>))}
    </span>
  );
}

export function StatusTag({ status }: { status: Status }) {
  const color = status === "OPEN" ? "text-go" : status === "CHALLENGED" ? "text-safety" : status === "REJECTED" || status === "VOID" ? "text-ink-2" : "text-steel";
  return <span className={`tag ${color}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function VerdictStamp({ v, big = false }: { v: string; big?: boolean }) {
  if (!v) return <span className="tag text-ink-2">awaiting proof</span>;
  return (
    <span className={`${verdictClass(v)} ${big ? "rotate-stamp inline-block border-[5px] px-4 py-1 text-3xl" : "tag"} stencil border-current`}
      style={big ? { borderStyle: "double", borderWidth: 6 } : undefined}>
      {verdictText(v)}
    </span>
  );
}

export function Section({ code, title, aside, children }: { code: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-end justify-between gap-3 border-b-[3px] border-ink pb-1">
        <h2 className="stencil text-xl"><span className="mr-2 mono text-sm text-safety">{code}</span>{title}</h2>
        {aside && <div className="kicker">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

/** Launch log: live consensus progress. Done only at FINALIZED + verified contract state. */
export function TxLog({ status, hash, error }: { status: string | null; hash?: string | null; error?: string | null }) {
  if (!status && !error) return null;
  const failed = !!status && FAILED_STATUSES.has(status);
  const idx = status ? TX_STEPS.indexOf(status as (typeof TX_STEPS)[number]) : -1;
  const lines = status === "SIGNING" ? ["Awaiting your signature in the wallet"] : idx >= 0 ? TX_STEPS.slice(0, idx + 1).map(String) : status ? [status] : [];
  return (
    <div className="board mt-4 p-3 mono text-[12px]" data-testid="tx-log">
      <div className="mb-1 tracking-[.2em] text-[10px] opacity-70">LAUNCH LOG</div>
      {lines.map((l, i) => (
        <div key={l + i}>
          <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span> {l}
          {i === lines.length - 1 && !failed && status !== "FINALIZED" && !error && <span className="animate-pulse"> ▮</span>}
        </div>
      ))}
      {failed && <div className="text-[#ff7b6b]">Validators could not agree ({status}). Nothing was recorded and no points moved.</div>}
      {status === "ACCEPTED" && !error && <div className="opacity-80">Accepted, waiting for FINALIZED. Not done yet.</div>}
      {status === "FINALIZED" && !error && <div className="text-[#7ee0a1]">Finalized and verified against contract state.</div>}
      {error && <div className="mt-1 text-[#ff7b6b]">Rejected: {error}</div>}
      {hash && <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer" className="link mt-1 inline-block opacity-80">tx {hash.slice(0, 12)}…</a>}
    </div>
  );
}

export function More({ q }: { q: { hasNextPage?: boolean; isFetchingNextPage?: boolean; fetchNextPage: () => unknown } }) {
  if (!q.hasNextPage) return <p className="kicker mt-3 text-center">end of manifest</p>;
  return (
    <div className="mt-4 text-center">
      <button className="btn btn-dark" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
        {q.isFetchingNextPage ? "Loading…" : "Load older manifests"}
      </button>
    </div>
  );
}
