"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTx, useUser } from "@/lib/hooks";
import { verifiers } from "@/lib/pos";
import { useWallet } from "@/lib/WalletProvider";
import { Section, TxLog } from "@/components/ui";

const DEADLINES = [[300, "5 minutes (test)"], [3600, "1 hour"], [86400, "1 day"], [7 * 86400, "7 days"], [30 * 86400, "30 days"]] as const;
const WINDOWS = [[60, "1 minute (test)"], [600, "10 minutes"], [3600, "1 hour"], [86400, "1 day"], [3 * 86400, "3 days"]] as const;

export default function NewCommitment() {
  const w = useWallet();
  const user = useUser(w.address);
  const tx = useTx();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [deliv, setDeliv] = useState("");
  const [crit, setCrit] = useState<string[]>([""]);
  const [kind, setKind] = useState("REPO");
  const [stake, setStake] = useState(50);
  const [dl, setDl] = useState(86400);
  const [rw, setRw] = useState(3600);
  const [notice, setNotice] = useState<string | null>(null);
  const clean = crit.map((c) => c.trim()).filter(Boolean);
  const ok = !!w.address && title.trim().length >= 8 && deliv.trim().length >= 30 && clean.length >= 1 && clean.every((c) => c.length >= 10 && c.length <= 200) && stake >= 10;

  async function submit() {
    setNotice(null);
    const t = title.trim();
    const r = await tx.run("create_commitment", [t, deliv.trim(), clean, kind, stake, dl, rw], {
      key: `create:${t}`,
      verify: (res) => verifiers.created(w.address as string, t, res),
    });
    if (!r) return;
    const id = Number(r.values.id);
    router.push(`/c/${id}`);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="label p-5">
        <p className="kicker">Form POS-1 · Bill of lading</p>
        <h1 className="stencil text-3xl">Book a commitment</h1>
        <Section code="01" title="Payload">
          <label className="kicker">Title</label>
          <input className="field mt-1" placeholder="Ship tally CLI v1.0" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
          <label className="kicker mt-3 block">What you will ship (30-600 chars)</label>
          <textarea className="field mt-1 h-24" placeholder="A command line tool that exports time logs to CSV and JSON, published with install docs." value={deliv} onChange={(e) => setDeliv(e.target.value)} maxLength={600} />
        </Section>
        <Section code="02" title="Locked acceptance criteria" aside={`${clean.length}/5 · cannot be edited later`}>
          {crit.map((c, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <span className="cell stencil w-10 text-center">{i + 1}</span>
              <input className="field" placeholder={i === 0 ? "The tally export command writes a CSV file" : "Another checkable criterion"} value={c}
                onChange={(e) => setCrit(crit.map((x, k) => (k === i ? e.target.value : x)))} maxLength={200} />
              {crit.length > 1 && <button className="btn btn-dark !px-2" onClick={() => setCrit(crit.filter((_, k) => k !== i))} aria-label="remove">✕</button>}
            </div>
          ))}
          {crit.length < 5 && <button className="btn btn-dark !py-1 text-sm" onClick={() => setCrit([...crit, ""])}>+ criterion</button>}
          <p className="mt-2 text-sm text-ink-2">Each criterion must be checkable from a public page (10-200 chars). An AI screen rejects vague or subjective criteria like &quot;users love it&quot; <b>before</b> any stake is taken.</p>
        </Section>
        <Section code="03" title="Proof, stake and schedule">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="kicker">Expected proof type</label>
              <select className="field mt-1" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="REPO">REPO: page on a code host</option>
                <option value="RELEASE">RELEASE: tag / release / commit-pinned file</option>
                <option value="DEMO">DEMO: any public https page</option>
              </select>
            </div>
            <div>
              <label className="kicker">Stake (points, min 10)</label>
              <input className="field mt-1" type="number" min={10} value={stake} onChange={(e) => setStake(Number(e.target.value))} />
            </div>
            <div>
              <label className="kicker">Deadline</label>
              <select className="field mt-1" value={dl} onChange={(e) => setDl(Number(e.target.value))}>
                {DEADLINES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="kicker">Review window (judge / challenge)</label>
              <select className="field mt-1" value={rw} onChange={(e) => setRw(Number(e.target.value))}>
                {WINDOWS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </Section>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button className="btn btn-safety" disabled={!ok || tx.busy} onClick={submit}>{tx.busy ? "In consensus…" : "Lock & book commitment"}</button>
          {!w.address && <span className="kicker">connect a wallet first</span>}
          {user.data && <span className="kicker">balance {user.data.balance} pts</span>}
        </div>
        {notice && <p className="mt-2 text-halt">{notice}</p>}
        <TxLog status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
      <aside className="space-y-4">
        <div className="board p-4 mono text-[13px]">
          <p className="tracking-[.2em] text-[10px] opacity-70">CARGO RULES</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-label/90">
            <li>Backing closes at half of the deadline window (anti front-running).</li>
            <li>No proof by the deadline = NOT SHIPPED automatically; your stake goes to your backers (or the pool).</li>
            <li>SHIPPED: stake back + every backing as a bounty. PARTIAL: stake back + half of each backing.</li>
            <li>A criterion counts as MET only with a verbatim quote from your proof.</li>
          </ul>
        </div>
        <div className="label p-4 text-sm">
          <p className="kicker">Disclosure</p>
          Points are non-monetary Studionet test units. They cannot be bought, sold or withdrawn.
        </div>
      </aside>
    </div>
  );
}
