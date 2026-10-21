// Builds deployments/RESULTS.md from deployments/e2e-*.json (on-chain e2e evidence).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
const dir = "deployments";
const dep = JSON.parse(readFileSync(`${dir}/studionet.json`, "utf8"));
const order = ["reject", "shipped", "partial", "missed", "overturn", "inconclusive", "uncompleted", "overlap", "concurrent", "changed-b", "uncompleted-attempt1", "changed-attempt1"];
const files = readdirSync(dir).filter((f) => /^e2e-.+\.json$/.test(f));
const runs = files.map((f) => ({ ...JSON.parse(readFileSync(`${dir}/${f}`, "utf8")), scenario: f.slice(4, -5) }))
  .sort((a, b) => order.indexOf(a.scenario) - order.indexOf(b.scenario));
const short = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : "-");
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
let md = `# ProofOfShip on-chain e2e results (GenLayer Studionet)\n\n`;
md += `Contract: [\`${dep.contractAddress}\`](https://explorer-studio.genlayer.com/address/${dep.contractAddress}) · chain 61999 · generated ${new Date().toISOString()} by \`node scripts/results.mjs\`.\n\n`;
md += `Every write below was submitted with genlayer-js, then polled until the transaction reached FINALIZED. Failed attempts (validator errors, retried by the script) are listed honestly.\n\n`;
md += `Files named *-attempt1 are kept as an honest record of first runs that did not pass: uncompleted-attempt1 used a 60 s review window that expired while validators were still judging (the contract correctly refused the late judge); changed-attempt1 was judged while the raw.githubusercontent CDN still served the old page to validators, so no change was observable. Both were rerun as uncompleted and changed-b.\n\n`;
md += `| Scenario | Txs | All FINALIZED | Checks passed |\n|---|---|---|---|\n`;
for (const r of runs) {
  const n = r.checks?.filter((c) => c.pass).length ?? 0;
  md += `| [${r.scenario}](#${r.scenario}) | ${r.steps?.length ?? 0} | ${r.all_finalized ? "yes" : "NO"} | ${n}/${r.checks?.length ?? 0}${r.all_checks_pass ? "" : " ⚠"} |\n`;
}
for (const r of runs) {
  md += `\n## ${r.scenario}\n\n${r.startedAt} → ${r.finishedAt ?? "(unfinished)"}\n\n| Step | Actor | Result | Final | Tx |\n|---|---|---|---|---|\n`;
  for (const s of r.steps ?? []) md += `| ${esc(s.step)} | ${s.actor} | ${s.status}/${s.execution}${s.ok ? "" : " (failed attempt)"} | ${s.final_status ?? "-"} | ${s.explorer ? `[${short(s.tx)}](${s.explorer})` : "-"} |\n`;
  md += `\n| Check | Pass | Detail |\n|---|---|---|\n`;
  for (const c of r.checks ?? []) md += `| ${esc(c.check)} | ${c.pass ? "PASS" : "FAIL"} | \`${esc(JSON.stringify(c.detail)).slice(0, 160)}\` |\n`;
}
writeFileSync(`${dir}/RESULTS.md`, md);
console.log("wrote", `${dir}/RESULTS.md`, runs.map((r) => `${r.scenario}:${r.all_finalized && r.all_checks_pass}`).join(" "));
