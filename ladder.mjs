// ladder.mjs -- the status line, version 0: run a scripted ladder through URGE and render lines.
//
// One module, run unchanged by Node (bin/run.mjs writes ledger.json) and by the page
// (index.html recomputes it and says whether the two agree). The specification is
// status-line.md beside this file; this file carries the same version. URGE is the only thing that
// decides a verdict; this file evaluates nothing itself.

export const VERSION = 0;
export const FORMAT = "status-line-ladder/0";

export const AGENTS = {
  janus:   { glyph: "⚖️", name: "Janus",   class: "noevo", does: "verifies" },
  oonia:   { glyph: "🐌", name: "Oonia",   class: "noevo", does: "orchestrates" },
  hermes:  { glyph: "📖", name: "Hermes",  class: "noevo", does: "speaks to the person" },
  curator: { glyph: "📚", name: "Curator", class: "noevo", does: "keeps the record" },
  athena:  { glyph: "⭐", name: "Athena",  class: "evo",   does: "advises" },
  helios:  { glyph: "🔥", name: "Helios",  class: "evo",   does: "composes" },
};

export const VERBS = {
  janus: ["verifying", "verified", "denied"],
  oonia: ["orchestrating", "routed"],
  hermes: ["says"],
  curator: ["recording", "recorded"],
  athena: ["advises"],
  helios: ["composed"],
};

export const RUNGS = {
  W0: "Heartbeat establishment",
  W1: "Sensing the locale",
  W2: "The pill minder",
  W3: "Appointments, integrated outward",
};

export const BUDGET = { phone: 40, portlet: 80, ward: 80 };

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Run the ladder: assign seq and session, evaluate every gate with URGE, admit EVO lines.
// `evaluate(expr, ctxJson) -> string` is URGE's evaluate_str. Returns the ledger.
export async function run(ladder, evaluate, engine = {}) {
  if (ladder.format !== FORMAT) throw new Error(`ladder format ${ladder.format}, expected ${FORMAT}`);
  const events = [];
  let session = null;
  let lastJanus = null;
  let t = Date.UTC(2026, 8, 22, 7, 0, 0);
  for (let i = 0; i < ladder.events.length; i++) {
    const src = ladder.events[i];
    const agent = AGENTS[src.agent];
    if (!agent) throw new Error(`unknown agent ${src.agent} at event ${i + 1}`);
    if (!VERBS[src.agent].includes(src.verb)) throw new Error(`${src.agent} has no verb ${src.verb}`);
    const ev = {
      v: VERSION,
      t: t += 1000 + (i % 3) * 700,
      igent: ladder.igent,
      session,
      seq: i + 1,
      agent: src.agent,
      class: agent.class,
      verb: src.verb,
      object: src.object ?? null,
      rung: src.rung,
      step: src.step,
      verdict: null,
      text: src.text ?? null,
    };
    if (src.gate) {
      if (src.agent !== "janus") throw new Error(`only Janus decides; event ${i + 1} is ${src.agent}`);
      const raw = JSON.parse(evaluate(src.gate.expr, JSON.stringify(src.gate.slots)));
      if (raw.error) throw new Error(`URGE: ${raw.error} on event ${i + 1}`);
      const traceJson = JSON.stringify(raw.trace?.entries ?? []);
      ev.verdict = {
        valid: raw.valid,
        confidence: raw.confidence,
        expr: src.gate.expr,
        notation: raw.formal_notation,
        trace: "sha256:" + (await sha256(traceJson)).slice(0, 16),
      };
      ev.slots = src.gate.slots;
      ev.trace_entries = (raw.trace?.entries ?? []).map((e) => ({
        stage: e.stage + (e.paradigm ? ":" + e.paradigm : ""), text: e.description ?? "", outcome: e.outcome ?? "",
      }));
      ev.conflict = raw.cross_validation?.consistent === false ? (raw.cross_validation.conflict_detail ?? "conflict") : null;
      const expected = src.verb === "verified";
      ev.script_agrees = raw.valid === expected;
      lastJanus = ev;
    }
    if (agent.class === "evo") {
      if (!lastJanus || !lastJanus.verdict?.valid || src.admitted_by !== "previous") {
        throw new Error(`EVO line ${i + 1} (${src.agent}) has no admitting Janus verdict`);
      }
      ev.verdict = { ...lastJanus.verdict, by: lastJanus.seq };
    }
    if (src.opens_session) session = ladder.session;
    events.push(ev);
  }
  const verdicts = events.filter((e) => e.agent === "janus" && e.verdict);
  return {
    format: FORMAT,
    version: VERSION,
    igent: ladder.igent,
    engine,
    events,
    counts: {
      events: events.length,
      decided: verdicts.length,
      permit: verdicts.filter((e) => e.verdict.valid).length,
      deny: verdicts.filter((e) => !e.verdict.valid).length,
      script_disagreements: verdicts.filter((e) => !e.script_agrees).length,
    },
  };
}

export function mark(ev) {
  if (ev.agent === "hermes") return "";
  if (!VERBS[ev.agent]?.includes(ev.verb)) return "?";
  if (ev.verdict) return ev.verdict.valid ? "✓" : "✗";
  return ev.verb.endsWith("ing") ? "…" : "";
}

// The line as a device shows it, within a character budget. The mark is never truncated.
export function line(ev, budget = Infinity) {
  const a = AGENTS[ev.agent];
  if (ev.agent === "hermes") {
    const head = `${a.glyph} ${a.name}: `;
    const room = budget - head.length;
    const text = ev.text ?? "";
    return head + (text.length > room ? text.slice(0, Math.max(0, room - 1)) + "…" : text);
  }
  const m = mark(ev);
  const head = `${a.glyph} ${a.name} ${ev.verb} `;
  const tail = m ? ` ${m}` : "";
  const room = budget - head.length - tail.length;
  const obj = ev.object ?? "";
  const shown = obj.length > room ? obj.slice(0, Math.max(0, room - 1)) + "…" : obj;
  return head + shown + tail;
}

// The latest line per agent, in the six's order: what a status bar shows.
export function statusBar(events, upto = Infinity) {
  const latest = {};
  for (const ev of events) {
    if (ev.seq > upto) break;
    latest[ev.agent] = ev;
  }
  return Object.keys(AGENTS).map((k) => latest[k] ?? null);
}

// What two ledgers are compared on: the events as decided, no timestamps, no trace text.
export function comparable(ledger) {
  return JSON.stringify({
    format: ledger.format, version: ledger.version, igent: ledger.igent,
    events: ledger.events.map((e) => ({
      seq: e.seq, session: e.session, agent: e.agent, class: e.class, verb: e.verb, object: e.object,
      rung: e.rung, step: e.step, text: e.text,
      verdict: e.verdict ? { valid: e.verdict.valid, confidence: e.verdict.confidence, expr: e.verdict.expr, notation: e.verdict.notation, trace: e.verdict.trace, by: e.verdict.by ?? null } : null,
    })),
    counts: ledger.counts,
  });
}
