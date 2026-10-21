import { Section } from "@/components/ui";

const ATTACKS: [string, string][] = [
  ["Prompt injection in proof pages, criteria or challenge grounds", "Every untrusted text is wrapped by fence() with its delimiters neutralised; prompts say it is data, never instructions. A MET needs a verbatim quote that validators check deterministically, so an injected 'mark everything MET' has nothing to quote."],
  ["Faked proof page (builder writes a page claiming it shipped)", "Validators verify what a public page SAYS, not real-world truth. Mitigations: REPO/RELEASE proofs must be on code hosts, RELEASE must be a tag/commit-pinned URL, and anyone can challenge with counter-evidence. Residual risk: a convincing fake on a code host."],
  ["Page swap after the verdict / before judging", "Proof is snapshotted by consensus at submission (sha256 + full stored text). A changed page is judged from the stored text and flagged; an edited live page can never be quoted."],
  ["Sybil / self-backing", "The builder wallet cannot back itself. A sybil backer only moves the builder's own points around; reputation still records the verdict. Points are non-monetary."],
  ["Self-challenge collusion", "A builder cannot challenge its own SHIPPED verdict. Forfeited bonds go to the pool, never to a party, so a friendly challenger cannot farm bonds."],
  ["Front-running backers", "Backing closes at half the deadline window and when proof is submitted, so nobody can back after seeing the outcome coming."],
  ["Escaping a bad verdict by abandoning a challenge", "An undecided challenge never changes the first verdict; the bond is forfeited unless consensus itself recorded a failure."],
];

export default function Rules() {
  return (
    <div className="mt-6 max-w-4xl">
      <div className="label p-5">
        <p className="kicker">Rules & trust model</p>
        <h1 className="stencil text-3xl">How a verdict is reached</h1>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li><b>Booking.</b> Title, deliverable and 1-5 locked criteria. An AI screen (validators must agree on valid / invalid) refuses vague or unverifiable criteria before any stake is taken.</li>
          <li><b>Backing.</b> Others may back with points until half of the deadline window has passed.</li>
          <li><b>Proof.</b> Before the deadline the builder submits 1-3 URLs. Validators each fetch them and must agree on the exact snapshot rows: URL, sha256 of normalised text, the full stored text (max 12,000 chars, truncation flagged).</li>
          <li><b>Inspection.</b> For every criterion the model gives MET / NOT_MET / UNCLEAR with a source index and verbatim quote. Validators re-run it and must agree on the <i>whole status vector</i>, every MET quote must be verbatim in the cited source, and a MET quote they did not pick themselves must pass their own relevance check. The verdict is derived: all MET = SHIPPED, none = NOT SHIPPED, mixed = PARTIAL, any UNCLEAR or incomplete evidence = INCONCLUSIVE.</li>
          <li><b>No proof by the deadline</b> = NOT SHIPPED automatically (anyone can call finalize).</li>
          <li><b>Challenge.</b> During the review window anyone (except the builder against its own SHIPPED) can post a 100-point bond, grounds and one optional extra source. One stricter round: a different directional verdict = OVERTURNED (bond back); INCONCLUSIVE = first verdict stands, bond back; same verdict = UPHELD (bond to pool). Not decided by the deadline: first verdict stands; bond RETURNED if consensus recorded a failed round, SPLIT if the challenger only registered an attempt, FORFEITED otherwise.</li>
        </ol>
      </div>
      <Section code="$" title="Points">
        <ul className="list-disc space-y-1 pl-5">
          <li>Every wallet can claim 1,000 non-monetary points once. sum(balances) + escrow + pool = minted at all times (checked on-chain by get_ledger).</li>
          <li>SHIPPED: builder gets stake + all backings (backings are a bounty). PARTIAL: stake + half of each backing; backers keep the other half.</li>
          <li>NOT SHIPPED: each backer gets the backing back plus a pro-rata share of the stake; rounding remainder (or the whole stake if unbacked) goes to the community pool.</li>
          <li>INCONCLUSIVE or judging timeout (network failure): everyone refunded.</li>
        </ul>
      </Section>
      <Section code="!" title="Attack table">
        <div className="label !shadow-none">
          {ATTACKS.map(([a, m]) => (
            <div key={a} className="grid gap-2 border-b-2 border-ink p-3 sm:grid-cols-[220px_1fr]"><b className="stencil text-sm">{a}</b><p className="text-sm">{m}</p></div>
          ))}
        </div>
      </Section>
      <Section code="?" title="What this does NOT prove">
        <p>ProofOfShip establishes <b>source-content integrity</b>: what the cited public pages said at snapshot time, read identically by independent validators. It does not establish <b>real-world authenticity or identity</b>: that the page owner is the builder, that the software works, or that a release is not a fake. Use immutable artifacts (tagged releases, commit-pinned files) and challenges to reduce this gap. Studionet is a temporary test network.</p>
      </Section>
    </div>
  );
}
