"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBuilderCommitments, useUser } from "@/lib/hooks";
import { pts } from "@/lib/format";
import { More, Section, StatusTag, VerdictStamp, manifestNo } from "@/components/ui";

export default function BuilderProfile() {
  const { address } = useParams<{ address: string }>();
  const ok = /^0x[0-9a-fA-F]{40}$/.test(address);
  const user = useUser(ok ? address : null);
  const list = useBuilderCommitments(ok ? address : "");
  if (!ok) return <p className="mt-8">Not a wallet address.</p>;
  const r = user.data?.reputation;
  const rows = list.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <div className="mt-6">
      <div className="label label-hole p-5">
        <p className="kicker">Crew record</p>
        <h1 className="stencil break-all text-xl sm:text-2xl">{address}</h1>
        {user.isLoading && <p className="mono">Loading reputation…</p>}
        {r && (
          <div className="mt-4 grid gap-3 sm:grid-cols-4" data-testid="reputation">
            <Gauge label="Ship rate" value={`${(r.ship_rate_bps / 100).toFixed(0)}%`} sub={`${r.judged} judged`} />
            <Gauge label="Streak" value={String(r.streak)} sub={`best ${r.best_streak}`} />
            <Gauge label="Score" value={String(r.score)} sub="rate + 2 per best-streak step (max 10)" />
            <Gauge label="Balance" value={`${pts(user.data!.balance)}`} sub="points" />
          </div>
        )}
        {r && (
          <div className="mt-4 flex flex-wrap gap-2 mono text-[12px]">
            <span className="tag stamp-shipped">shipped {r.shipped}</span>
            <span className="tag stamp-partial">partial {r.partial}</span>
            <span className="tag stamp-not">not shipped {r.not_shipped} (missed deadline {r.missed})</span>
            <span className="tag stamp-inc">inconclusive {r.inconclusive}</span>
            <span className="tag">accepted commitments {r.commitments}</span>
          </div>
        )}
      </div>
      <Section code="H" title="Commitment history" aside={`${list.data?.pages[0]?.total ?? 0} total · newest first`}>
        <div className="board">
          {rows.map((c) => (
            <Link key={c.id} href={`/c/${c.id}`} className="board-row flex flex-wrap items-center gap-3 border-b border-[#2a2e33] px-3 py-2 mono text-[13px]">
              <span>{manifestNo(c.id)}</span><span className="flex-1 text-label">{c.title}</span>
              <span className="text-label"><StatusTag status={c.status} /></span>
              <span className="bg-label px-1"><VerdictStamp v={c.verdict} /></span>
            </Link>
          ))}
          {!list.isLoading && rows.length === 0 && <p className="p-3 mono">No commitments yet.</p>}
        </div>
        <More q={list} />
      </Section>
    </div>
  );
}

function Gauge({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="board p-3 text-center">
      <p className="mono text-[10px] tracking-[.2em] opacity-70">{label.toUpperCase()}</p>
      <p className="stencil text-3xl text-amber">{value}</p>
      <p className="mono text-[10px] opacity-60">{sub}</p>
    </div>
  );
}
