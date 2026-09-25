# The status line — stream-0 event, version 0

**One event, one line, one verdict.** Every igent emits it on stream 0 of its igent.me
session and renders it with whatever the device has. It is the smallest reading that
answers *who is doing what, and was it allowed*. The verdict on the line is
URGE's, never a model's. This page is the specification; `index.html` beside it is the
demonstration; the igent.me contract carries this section by reference.

## 1. The event

```json
{ "v": 0,
  "t": 1789564800123,
  "igent": "sh-0001",
  "session": "5c1e…",
  "seq": 17,
  "agent": "janus",
  "class": "noevo",
  "verb": "verified",
  "object": "secure connection",
  "rung": "W0",
  "step": "handshake",
  "verdict": { "valid": true, "confidence": 255,
               "expr": "must tls_established and must bio_signature_fresh",
               "notation": "O(tls_established) ∧ O(bio_signature_fresh)",
               "trace": "sha256:9f2c…" },
  "text": null }
```

| Field | Type | Rule |
|---|---|---|
| `v` | int | the version of this shape; 0 |
| `t` | int | milliseconds since the epoch on the device clock; igent.me stamps receipt separately and never rewrites `t` |
| `igent` | string | the device id from the register (contract §1) |
| `session` | string or null | the W0 session id; null on the lines that establish it |
| `seq` | int | monotonic per session, starting at 1; a renderer orders by `seq`, not `t` |
| `agent` | enum | `janus` `oonia` `hermes` `curator` `athena` `helios` |
| `class` | enum | `noevo` or `evo`, derived from `agent`; carried so a renderer with no table still shows it |
| `verb` | enum | per agent, §3; present participle = in progress, past tense = decided |
| `object` | string ≤ 48 | what the verb is about, in the ward's language |
| `rung` | enum | `W0` heartbeat · `W1` locale · `W2` pill minder · `W3` appointments; the workflow ladder |
| `step` | string ≤ 32 | the step name inside the rung's workflow |
| `verdict` | object or null | §2; null while a NOEVO agent is in progress and never null on an EVO line |
| `text` | string ≤ 140 or null | Hermes only: the sentence for the person, in their language, at their literacy |

Size: the event without `verdict.trace` text stays under 400 bytes. It travels on stream 0
(reliable, ordered), not in the heartbeat datagram, whose ~200-byte budget is the
contract's §2 and untouched by this shape.

## 2. The verdict

| Field | Rule |
|---|---|
| `valid` | URGE's `valid`: true renders as ✓ PERMIT, false as ✗ DENY |
| `confidence` | URGE's, 0–255; agreement among the engines that ran (exhaustive mode) |
| `expr` | the governance expression Janus evaluated, over named slots; the reader can re-run it |
| `notation` | URGE's `formal_notation` |
| `trace` | a reference to the full trace, `sha256:` of the trace JSON as Curator stored it |
| `by` | on an EVO line only: the `seq` of the Janus line that admitted it |

Rules. **Janus decides.** A verdict originates only on a Janus line with a past-tense verb
(`verified`, `denied`). **EVO lines are admitted, not decided.** Athena and Helios propose;
their line is emitted only after a Janus line admitted the proposal, and it carries that
verdict with `by` pointing at it. A device never shows an EVO line before its Janus line.
**A denial is a line, not an absence.** `denied` is emitted like any other decision, and
Hermes says what it means. **The trace is the record.** Curator stores the trace URGE
returned; the line carries its hash; nothing on the line is regenerated.

## 3. Verbs, per agent

| Agent | Class | In progress | Decided or done | Object |
|---|---|---|---|---|
| ⚖️ Janus | NOEVO | `verifying` | `verified` · `denied` | the action, connection or read under decision |
| 🐌 Oonia | NOEVO | `orchestrating` | `routed` | the request or event, and where it went |
| 📖 Hermes | NOEVO | — | `says` | none; `text` carries the sentence |
| 📚 Curator | NOEVO | `recording` | `recorded` | the record: session, Observation, MedicationStatement, Appointment |
| ⭐ Athena | EVO | — | `advises` | the advice, after Janus admitted it |
| 🔥 Helios | EVO | — | `composed` | the workflow, after Janus admitted it |

Six agents, eleven verbs. A renderer that meets another verb shows the line unchanged and
marks it `?`; it does not drop it.

## 4. The line

```
<glyph> <Name> <verb> <object> <mark>          e.g.   ⚖️ Janus verified secure connection ✓
📖 Hermes: <text>                                e.g.   📖 Hermes: You are connected.
```

`mark` is ✓ for `valid: true`, ✗ for `valid: false`, … while the verb is in progress
(`verifying`, `orchestrating`, `recording`), nothing on a done line that carries no verdict
(`recorded`, `routed`), and `?` for a verb the renderer does not know. Hermes lines show
`text`, no verb, no mark. An EVO line shows the admitting verdict's mark. **The mark is never truncated**; `object` truncates
with a single `…` to fit the budget below. Colour is optional; the mark is the signal.

| Device | Budget | Renders |
|---|---|---|
| phone notification (rung 2, the S23) | 40 characters | the latest line; the ledger behind a tap |
| desktop portlet (rung 1) | 80 characters | a status bar: the latest line per agent; the ledger beneath |
| sensor head, drone | none | no screen: the event goes up stream 0; an LED ring or e-ink strip is a question for the head's physical design |
| Bolt Buddy, wheelchair buddy | 40 | the head unit or the phone, as a notification |
| bauble | its own | the panel, its own design |
| ward display | 80 | every igent's latest line, one row per igent |

## 5. The ladder, as lines

What each rung emits, in order, so a device on W0 alone already shows something true:

| Rung | Lines |
|---|---|
| W0 heartbeat | Oonia orchestrating sign-on · Janus verifying secure connection · Janus verified ✓ · Janus verified bio-signature ✓ · Curator recorded session · Hermes says |
| W1 locale | Janus verified device `<id>` ✓ or denied ✗ · Curator recorded Observation · Oonia routed threshold event to articulation or navigation · Hermes says |
| W2 pill minder | Helios composed reminder workflow (admitted) · Athena advises `<medication>` (admitted) · Janus verified show reminder here and now ✓ or denied ✗ · Hermes says · Curator recorded MedicationStatement |
| W3 appointments | Hermes says (the request) · Oonia routed to scheduling · Athena advises slot (admitted) · Janus verified consent and portal access ✓ · Curator recorded Appointment · Hermes says |

## 6. What this is not

Not a log format: Curator's ledger holds the traces and the FHIR resources; the line
carries a hash. Not a chat: only Hermes speaks, and only in `text`. Not a plane: a page
that shows every line is a ledger view, and whether anything beyond it is needed is left open.
Not the heartbeat: the datagram keeps its own shape and budget in the contract.

## 7. Versions

| | Date | Change |
|---|---|---|
| v0 | 2026-09-21 | first shape; the demonstration in `site/` evaluates every Janus verdict with URGE 0.1.1 |
