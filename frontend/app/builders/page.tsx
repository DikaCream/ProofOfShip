"use client";

import Link from "next/link";
import { useBuilders } from "@/lib/hooks";
import { shortAddress } from "@/lib/format";
import { More, Section } from "@/components/ui";

export default function Builders() {
  const q = useBuilders();
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <Section code="CR" title="Crews and their ship record" aside="newest crews first · reputation is on-chain">
      <div className="board overflow-x-auto">
        <table className="w-full min-w-[640px] mono text-[13px]">
          <thead><tr className="text-left text-[10px] tracking-[.2em] opacity-60"><th className="px-3 py-2">CREW</th><th>SHIP RATE</th><th>SHIPPED</th><th>PARTIAL</th><th>NOT SHIPPED</th><th>STREAK</th><th className="pr-3">SCORE</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.builder} className="board-row border-t border-[#2a2e33]">
                <td className="px-3 py-2"><Link className="link" href={`/builder/${b.builder}`}>{shortAddress(b.builder)}</Link></td>
                <td>{b.judged ? `${(b.ship_rate_bps / 100).toFixed(0)}%` : "—"}</td><td>{b.shipped}</td><td>{b.partial}</td><td>{b.not_shipped}</td><td>{b.streak} (best {b.best_streak})</td><td className="pr-3">{b.score}</td>
              </tr>
            ))}
            {q.isLoading && <tr><td className="px-3 py-3" colSpan={7}>Loading crews…</td></tr>}
          </tbody>
        </table>
      </div>
      <More q={q} />
    </Section>
  );
}
