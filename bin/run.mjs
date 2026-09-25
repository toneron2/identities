#!/usr/bin/env node
// bin/run.mjs -- run the ladder through URGE from the command line and write ledger.json.
//
//   node bin/run.mjs            writes ledger.json and prints every line as a phone shows it
//   node bin/run.mjs --check    recomputes and compares with ledger.json: CURRENT or STALE
//
// The page runs the same ladder.mjs and the same WebAssembly and says whether it agrees.

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import init, { evaluate_str, version } from "../urge/urge_wasm.js";
import { run, line, comparable, sha256, BUDGET } from "../ladder.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes("--check");
const wasm = await readFile(join(root, "urge", "urge_wasm_bg.wasm"));
await init({ module_or_path: wasm });

const ladder = JSON.parse(await readFile(join(root, "ladder.json"), "utf8"));
const ledger = await run(ladder, evaluate_str, {
  urge_version: version(),
  wasm_sha256: createHash("sha256").update(wasm).digest("hex"),
});
ledger.ledger_sha256 = await sha256(comparable(ledger));
const out = join(root, "ledger.json");
const c = ledger.counts;
const summary = `${c.events} events, ${c.decided} decided by URGE: ${c.permit} PERMIT, ${c.deny} DENY` +
  (c.script_disagreements ? `, ${c.script_disagreements} where the script's verb disagrees with URGE` : "");

if (check) {
  let stored = null;
  try { stored = JSON.parse(await readFile(out, "utf8")); } catch {}
  if (stored?.ledger_sha256 === ledger.ledger_sha256) {
    console.log(`CURRENT  ledger.json  ${ledger.ledger_sha256.slice(0, 16)}  ${summary}`);
    process.exit(0);
  }
  console.log(`STALE  ledger.json  stored ${String(stored?.ledger_sha256).slice(0, 16)}, computed ${ledger.ledger_sha256.slice(0, 16)}`);
  process.exit(1);
}

ledger.generated = new Date().toISOString();
await writeFile(out, JSON.stringify(ledger, null, 2) + "\n");
console.log(`wrote ${out}  ${ledger.ledger_sha256.slice(0, 16)}`);
console.log(summary);
for (const ev of ledger.events) {
  const phone = line(ev, BUDGET.phone);
  console.log(`${String(ev.seq).padStart(2)} ${ev.rung} ${phone.padEnd(42)}${ev.verdict && ev.agent === "janus" ? ` ${ev.verdict.notation}` : ""}`);
}
