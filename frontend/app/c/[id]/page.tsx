"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useBackers, useCommitment, useNow, useRounds, useSnapshots, useTx } from "@/lib/hooks";
import { getCommitment, verifiers, type Commitment, type Round, type Status } from "@/lib/pos";
import { CHALLENGE_BOND, txExplorerUrl } from "@/lib/config";
import { host, pts, sameAddress, shortAddress, utc } from "@/lib/format";
import { useWallet } from "@/lib/WalletProvider";
import { Flaps, Section, StatusTag, TxLog, VerdictStamp, manifestNo } from "@/components/ui";

export default function Detail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const valid = Number.isInteger(id) && id >= 0;
  const q = useCommitment(valid ? id : null);
  const c = q.data;
  const rounds = useRounds(valid ? id : null, c?.rounds ?? 0);
  const snaps = useSnapshots(valid ? id : null, c ? `${c.proof_at}:${c.challenge_url}` : "");
  const backers = useBackers(valid ? id : null, c?.backers ?? 0);
  const now = useNow();
  if (!valid) return <p className="mt-8">Invalid manifest id.</p>;
  if (q.isLoading) return <p className="mt-8 mono">Loading manifest {manifestNo(id)} from Studionet…</p>;
  if (q.isError || !c) return <p className="mt-8 mono text-halt">Could not load {manifestNo(id)}: {(q.error as Error)?.message}</p>;
  const latest: Round | undefined = rounds.data?.filter((r) => r.kind === "INITIAL" || r.kind === "CHALLENGE").slice(-1)[0];
  const clock = c.status === "OPEN" ? c.deadline : c.status === "PROOF_SUBMITTED" ? c.judge_due : c.status === "JUDGED" ? c.challenge_ends : c.status === "CHALLENGED" ? c.challenge_due : 0;
  const clockLabel = { OPEN: "proof due", PROOF_SUBMITTED: "inspection due", JUDGED: "challenge window", CHALLENGED: "challenge must be decided" }[c.status as string];

  return (
    <div className="mt-6" data-testid="commitment" data-status={c.status} data-verdict={c.verdict}>
      <Link href="/" className="kicker link">← departures</Link>
      <div className="label label-hole mt-2 grid gap-0 sm:grid-cols-[1fr_260px]">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="stencil bg-ink px-2 text-hazard">{manifestNo(c.id)}</span>
            <StatusTag status={c.status} />
            <span className="tag">{c.proof_type}</span>
            {c.evidence_changed && <span className="tag text-safety">proof page changed after snapshot</span>}
          </div>
          <h1 className="stencil mt-2 text-3xl leading-tight sm:text-4xl">{c.title}</h1>
          <p className="mt-2 max-w-2xl">{c.deliverable}</p>
          <p className="mt-3 mono text-[12px]">
            Crew <Link className="link" href={`/builder/${c.builder}`}>{c.builder}</Link> · booked {utc(c.created_at)} · deadline {utc(c.deadline)}
          </p>
          {c.reject_reason && <p className="mt-3 border-l-4 border-halt pl-3"><b>Refused at the gate:</b> {c.reject_reason} (no stake taken)</p>}
        </div>
        <div className="border-t-[3px] border-ink p-4 sm:border-l-[3px] sm:border-t-0">
          <div className="barcode" />
          <dl className="mt-3 grid grid-cols-2 gap-1 mono text-[12px]">
            <dt>Stake</dt><dd className="text-right">{pts(c.stake)}</dd>
            <dt>Backed</dt><dd className="text-right">{pts(c.backed)} ({c.backers})</dd>
            <dt>Criteria</dt><dd className="text-right">{c.criteria.length}</dd>
          </dl>
          <div className="mt-3 text-center"><VerdictStamp v={c.verdict} big /></div>
          {c.first_verdict && c.first_verdict !== c.verdict && <p className="mt-2 text-center mono text-[11px]">first verdict {c.first_verdict}, revised by challenge</p>}
          {clock > 0 && (
            <div className="board mt-3 p-2 text-center">
              <div className="mono text-[10px] tracking-[.2em] opacity-70">{clockLabel?.toUpperCase()}</div>
              <Flaps seconds={clock - now} done="ELAPSED" />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Section code="A" title="Locked acceptance criteria" aside={latest ? `as judged in the ${latest.kind.toLowerCase()} round` : "not judged yet"}>
            <ol className="space-y-2" data-testid="criteria">
              {c.criteria.map((cr, i) => {
                const f = latest?.findings[i];
                const col = f?.status === "MET" ? "bg-go text-label" : f?.status === "NOT_MET" ? "bg-halt text-label" : f ? "bg-steel text-label" : "bg-label";
                return (
                  <li key={i} className="label !shadow-none flex gap-0">
                    <span className={`stencil w-24 shrink-0 border-r-2 border-ink p-2 text-center text-sm ${col}`}>{f ? f.status.replace("_", " ") : "PENDING"}</span>
                    <div className="p-2">
                      <p><span className="mono text-[12px] text-ink-2">#{i + 1}</span> {cr}</p>
                      {f?.quote && <blockquote className="mt-1 border-l-4 border-hazard pl-2 mono text-[12px]">&ldquo;{f.quote}&rdquo; <span className="text-ink-2">({host(f.url)}, source {f.source})</span></blockquote>}
                      {f?.fact && <p className="mt-1 text-sm text-ink-2">{f.fact}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>

          {c.proof_urls.length > 0 && (
            <Section code="B" title="Proof sources & snapshots" aside="sha256 of normalized text, taken by consensus">
              <div className="space-y-2">
                {(snaps.data ?? []).map((s) => (
                  <details key={s.url} className="label !shadow-none p-3">
                    <summary className="cursor-pointer">
                      <span className="tag mr-2">{s.who}</span>
                      <a className="link break-all mono text-[12px]" href={s.url} target="_blank" rel="noreferrer">{s.url}</a>
                      <span className="ml-2 mono text-[11px] text-ink-2">sha256 {s.sha256.slice(0, 16)}… · {s.text.length} chars{s.truncated ? " · TRUNCATED at 12,000" : ""}{s.immutable ? " · pinned/immutable" : " · mutable URL"}</span>
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap bg-[#fffdf8] p-2 mono text-[11px]">{s.text}</pre>
                  </details>
                ))}
              </div>
            </Section>
          )}

          {(rounds.data?.length ?? 0) > 0 && (
            <Section code="C" title="Inspection rounds" aside="findings re-derived by every validator">
              <div className="space-y-3">
                {rounds.data!.map((r, k) => (
                  <div key={k} className="label !shadow-none p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="stencil">{r.kind.replace("_", " ")}</span><VerdictStamp v={r.verdict === "VOID" ? "" : r.verdict} />
                      <span className="mono text-[11px] text-ink-2">{utc(r.timestamp)} · called by {shortAddress(r.caller)}</span>
                    </div>
                    <p className="mt-1 text-sm">{r.reasoning}</p>
                    {r.changed.length > 0 && <p className="mt-1 mono text-[12px] text-safety">Changed since snapshot (judged from stored text): {r.changed.join(", ")}</p>}
                    {r.incomplete.length > 0 && <p className="mt-1 mono text-[12px] text-halt">Incomplete evidence: {r.incomplete.join(", ")}</p>}
                    {r.findings.length > 0 && (
                      <table className="mt-2 w-full mono text-[11px]">
                        <thead><tr className="text-left text-ink-2"><th>#</th><th>status</th><th>src</th><th>verbatim quote</th></tr></thead>
                        <tbody>{r.findings.map((f) => <tr key={f.criterion} className="border-t border-ink/20 align-top"><td>{f.criterion + 1}</td><td>{f.status}</td><td>{f.source}</td><td>{f.quote || "—"}</td></tr>)}</tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div>
          <Actions c={c} now={now} />
          <Section code="D" title="Backers" aside={`${c.backers} · max 20`}>
            {(backers.data ?? []).length === 0 && <p className="text-sm text-ink-2">No backers yet.</p>}
            <ul className="space-y-1 mono text-[12px]">
              {(backers.data ?? []).map((b) => <li key={b.backer} className="flex justify-between border-b border-ink/30"><Link className="link" href={`/builder/${b.backer}`}>{shortAddress(b.backer)}</Link><span>{pts(b.amount)} pts</span></li>)}
            </ul>
          </Section>
          {c.challenger && (
            <Section code="E" title="Challenge">
              <div className="label !shadow-none p-3 text-sm">
                <p>By <span className="mono">{shortAddress(c.challenger)}</span> · bond {CHALLENGE_BOND} pts · {c.challenge_result || "pending"}{c.bond_note ? ` · bond ${c.bond_note}` : ""}</p>
                <p className="mt-1 italic">&ldquo;{c.challenge_grounds}&rdquo;</p>
                {c.challenge_url && <p className="mt-1 mono text-[12px] break-all">extra source: {c.challenge_url}</p>}
                <p className="mt-1 mono text-[11px] text-ink-2">attempts registered {c.challenge_attempts} · undetermined rounds {c.challenge_undetermined}</p>
              </div>
            </Section>
          )}
          <Section code="F" title="Timeline">
            <ol className="space-y-1 border-l-4 border-ink pl-3 mono text-[12px]">
              {([
                [c.created_at, `booked (${c.status === "REJECTED" ? "refused" : "screen passed"})`],
                c.status !== "REJECTED" ? [c.back_until, "backing closes"] : null,
                c.proof_at > 0 ? [c.proof_at, "proof submitted"] : null,
                c.verdict_at > 0 ? [c.verdict_at, `first verdict ${c.first_verdict}`] : null,
                c.challenged_at > 0 ? [c.challenged_at, "challenged"] : null,
                c.final_at > 0 ? [c.final_at, `${c.status === "VOID" ? "voided" : "final"}: ${c.outcome}. ${c.settlement}`] : null,
                c.status !== "REJECTED" && c.final_at === 0 ? [c.deadline, "deadline"] : null,
              ].filter(Boolean) as [number, string][])
                .sort((x, y) => x[0] - y[0])
                .map(([t, label], i) => <li key={i}>{utc(t)} {label}</li>)}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Actions({ c, now }: { c: Commitment; now: number }) {
  const w = useWallet();
  const tx = useTx();
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [amount, setAmount] = useState(50);
  const [grounds, setGrounds] = useState("");
  const [extra, setExtra] = useState("");
  const me = w.address;
  const isBuilder = sameAddress(me, c.builder);
  const expect = (ok: Status[]) => ({ verify: () => verifiers.status(c.id, ok) });
  const run = (fn: string, args: unknown[], ok: Status[], key = `${fn}:${c.id}`) => tx.run(fn, args, { key, ...expect(ok) });
  const box = (children: React.ReactNode) => (
    <Section code="!" title="Control panel">
      <div className="label p-4">{children}<TxLog status={tx.status} hash={tx.hash} error={tx.error} /></div>
    </Section>
  );
  if (!me) return box(<p className="text-sm">Connect a wallet to act on this manifest.</p>);
  if (c.status === "OPEN") {
    if (now >= c.deadline)
      return box(<><p className="text-sm">The deadline passed without proof. Anyone can log it: <b>NOT SHIPPED</b>, stake to backers.</p>
        <button className="btn btn-safety mt-3" disabled={tx.busy} onClick={() => run("finalize", [c.id], ["FINAL"])}>Log missed deadline</button></>);
    if (isBuilder)
      return box(<>
        <p className="kicker">Submit proof (1-3 public URLs, {c.proof_type})</p>
        {urls.map((u, i) => <input key={i} className="field mt-2" placeholder={i === 0 ? "https://github.com/you/repo/releases/tag/v1.0" : "optional extra proof URL"} value={u} onChange={(e) => setUrls(urls.map((x, k) => (k === i ? e.target.value : x)))} />)}
        <p className="mt-2 text-[13px] text-ink-2">Validators snapshot every page now (sha256 + stored text). Later edits cannot change the verdict. Prefer tags or commit-pinned URLs.</p>
        <button className="btn btn-safety mt-3" disabled={tx.busy || !urls.some((u) => u.trim())} onClick={() => run("submit_proof", [c.id, urls.map((u) => u.trim()).filter(Boolean)], ["PROOF_SUBMITTED"])}>Submit proof for inspection</button>
      </>);
    if (c.backing_open)
      return box(<>
        <p className="kicker">Back this cargo (min 10 pts)</p>
        <input className="field mt-2" type="number" min={10} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <p className="mt-2 text-[13px] text-ink-2">SHIPPED: your backing goes to the builder as a bounty. PARTIAL: half. NOT SHIPPED: you get it back plus a share of the builder&apos;s stake.</p>
        <button className="btn mt-3" disabled={tx.busy || amount < 10} onClick={() => tx.run("back", [c.id, amount], { key: `back:${c.id}`, verify: async () => ((await getCommitment(c.id)).backed >= c.backed + amount ? null : "backing not recorded") })}>Back {amount} pts</button>
      </>);
    return box(<p className="text-sm">Backing closed at {utc(c.back_until)}. Waiting for the builder&apos;s proof.</p>);
  }
  if (c.status === "PROOF_SUBMITTED")
    return box(now < c.judge_due
      ? <><p className="text-sm">Proof is on the dock. Anyone can start the AI inspection (validators re-read every snapshot and agree on each criterion).</p>
        <button className="btn btn-safety mt-3" disabled={tx.busy} onClick={() => run("judge", [c.id], ["JUDGED"])}>Run inspection</button></>
      : <><p className="text-sm">No verdict reached consensus in time: void and refund everyone.</p>
        <button className="btn mt-3" disabled={tx.busy} onClick={() => run("finalize", [c.id], ["VOID"])}>Void & refund</button></>);
  if (c.status === "JUDGED") {
    if (now >= c.challenge_ends)
      return box(<><p className="text-sm">Challenge window closed. Finalize to settle points and update reputation.</p>
        <button className="btn btn-safety mt-3" disabled={tx.busy} onClick={() => run("finalize", [c.id], ["FINAL"])}>Finalize departure</button></>);
    if (isBuilder && c.verdict === "SHIPPED") return box(<p className="text-sm">Your cargo was judged SHIPPED. Others may challenge until the window closes.</p>);
    return box(<>
      <p className="kicker">Challenge the verdict (bond {CHALLENGE_BOND} pts)</p>
      <textarea className="field mt-2 h-20" placeholder="Grounds of challenge (20-500 chars)" value={grounds} onChange={(e) => setGrounds(e.target.value)} maxLength={500} />
      <input className="field mt-2" placeholder="Optional counter-evidence URL" value={extra} onChange={(e) => setExtra(e.target.value)} />
      <p className="mt-2 text-[13px] text-ink-2">One stricter round. Overturned or inconclusive: bond back. Upheld or never pursued: bond to the pool. The first verdict stands unless legitimately revised.</p>
      <button className="btn btn-safety mt-3" disabled={tx.busy || grounds.trim().length < 20} onClick={() => run("challenge", [c.id, grounds.trim(), extra.trim()], ["CHALLENGED"])}>File challenge</button>
    </>);
  }
  if (c.status === "CHALLENGED")
    return box(now < c.challenge_due
      ? <><p className="text-sm">Under dispute. Anyone can run the stricter challenge round before {utc(c.challenge_due)}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-safety" disabled={tx.busy} onClick={() => run("rule_challenge", [c.id], ["FINAL", "CHALLENGED"])}>Run challenge round</button>
          {sameAddress(me, c.challenger) && c.challenge_attempts < 3 && <button className="btn btn-dark" disabled={tx.busy} onClick={() => run("register_challenge_attempt", [c.id], ["CHALLENGED"], `attempt:${c.id}:${c.challenge_attempts}`)}>Register attempt (+600s)</button>}
        </div></>
      : <><p className="text-sm">Challenge deadline passed: the first verdict stands; finalize applies the bond rules.</p>
        <button className="btn mt-3" disabled={tx.busy} onClick={() => run("finalize", [c.id], ["FINAL"])}>Apply finality</button></>);
  return box(<p className="text-sm">{c.status === "REJECTED" ? "Refused at the gate. Nothing to do." : `Closed: ${c.outcome}. ${c.settlement}`}{tx.hash && <a className="link ml-1" href={txExplorerUrl(tx.hash)}>last tx</a>}</p>);
}
