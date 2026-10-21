"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommitments, useNow, useStats, useLedger } from "@/lib/hooks";
import { STATUSES } from "@/lib/pos";
import { STATUS_LABEL } from "@/lib/ui";
import { pts, shortAddress } from "@/lib/format";
import { CONTRACT_ADDRESS } from "@/lib/config";
import { Flaps, More, StatusTag, VerdictStamp, manifestNo } from "@/components/ui";

export default function Board() {
  const [status, setStatus] = useState("");
  const q = useCommitments(status);
  const stats = useStats();
  const ledger = useLedger();
  const now = useNow();
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;
  return (
    <div>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="label label-hole p-5">
          <p className="kicker">Bill of lading · public build commitments</p>
          <h1 className="stencil mt-1 text-4xl leading-none sm:text-5xl">Say what you&apos;ll ship.<br /><span className="text-safety">Prove it shipped.</span></h1>
          <p className="mt-3 max-w-xl">
            Builders lock a checklist of acceptance criteria, a deadline and a points stake. Backers sponsor the cargo. When the
            proof arrives, GenLayer AI validators read the proof pages and judge every criterion with a verbatim quote. Miss the
            deadline and the cargo is logged <b>NOT SHIPPED</b> automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/new" className="btn">Book a commitment</Link>
            <Link href="/rules" className="btn btn-dark">How verdicts work</Link>
          </div>
        </div>
        <div className="board p-4">
          <p className="mono text-[10px] tracking-[.25em] opacity-70">MANIFEST TOTALS</p>
          {!CONTRACT_ADDRESS && <p className="mono text-sm">Contract address not configured.</p>}
          {stats.isError && <p className="mono text-sm text-[#ff7b6b]">Cannot reach Studionet: {(stats.error as Error).message}</p>}
          {stats.data && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 mono text-sm" data-testid="stats">
              <dt className="opacity-70">Commitments</dt><dd className="text-right text-lg">{stats.data.commitments}</dd>
              <dt className="opacity-70">On the dock</dt><dd className="text-right">{stats.data.by_status.OPEN}</dd>
              <dt className="opacity-70">Under dispute</dt><dd className="text-right">{stats.data.by_status.CHALLENGED}</dd>
              <dt className="opacity-70">Departed</dt><dd className="text-right">{stats.data.by_status.FINAL}</dd>
              <dt className="opacity-70">Crews</dt><dd className="text-right">{stats.data.builders}</dd>
              <dt className="opacity-70">Points in escrow</dt><dd className="text-right">{pts(stats.data.escrow)}</dd>
              <dt className="opacity-70">Community pool</dt><dd className="text-right">{pts(stats.data.pool)}</dd>
              <dt className="opacity-70">Ledger balanced</dt><dd className="text-right">{ledger.data ? (ledger.data.conserved ? "YES" : "NO") : "…"}</dd>
            </dl>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-1">
          {["", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`stencil border-2 border-ink px-2 py-1 text-[12px] ${status === s ? "bg-ink text-hazard" : "bg-label hover:bg-hazard"}`}>
              {s ? STATUS_LABEL[s as keyof typeof STATUS_LABEL] : "All cargo"}
            </button>
          ))}
          <span className="ml-auto kicker">{total} on this board · newest first</span>
        </div>
        <div className="board mt-2 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left mono text-[13px]" data-testid="board">
            <thead>
              <tr className="text-[10px] tracking-[.2em] opacity-60">
                <th className="px-3 py-2">MANIFEST</th><th>PAYLOAD</th><th>CREW</th><th>STATUS</th><th>VERDICT</th><th>DEPARTS</th><th className="pr-3 text-right">STAKE / BACKED</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading && <tr><td className="px-3 py-4" colSpan={7}>Loading manifest from Studionet…</td></tr>}
              {q.isError && <tr><td className="px-3 py-4 text-[#ff7b6b]" colSpan={7}>{(q.error as Error).message}</td></tr>}
              {!q.isLoading && rows.length === 0 && <tr><td className="px-3 py-4" colSpan={7}>No cargo in this lane yet.</td></tr>}
              {rows.map((c) => (
                <tr key={c.id} className="board-row border-t border-[#2a2e33]">
                  <td className="px-3 py-2"><Link className="link" href={`/c/${c.id}`}>{manifestNo(c.id)}</Link></td>
                  <td className="max-w-[280px] truncate text-label"><Link href={`/c/${c.id}`}>{c.title}</Link> <span className="opacity-50">[{c.proof_type}]</span></td>
                  <td><Link className="link opacity-80" href={`/builder/${c.builder}`}>{shortAddress(c.builder)}</Link></td>
                  <td className="text-label"><StatusTag status={c.status} /></td>
                  <td className="bg-label/95 px-2"><VerdictStamp v={c.verdict} /></td>
                  <td className="px-2">{c.status === "OPEN" ? <Flaps seconds={c.deadline - now} done="DUE" /> : <span className="opacity-60">{c.status === "REJECTED" ? "—" : "closed"}</span>}</td>
                  <td className="pr-3 text-right">{pts(c.stake)} / {pts(c.backed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <More q={q} />
      </section>
    </div>
  );
}
