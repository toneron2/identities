# Identities and the status line

**Six named agents as the faces of the roles BROAD already defines, and the one line of
icon and text every igent device renders: who is acting, what they did, and whether URGE
allowed it.**

| | |
|---|---|
| **Status** | Procurement in process. |
| **Specification** | [`status-line.md`](status-line.md), version 0: the stream-0 event, the verbs, the line and its marks, the device budgets |
| **Demonstration** | [`index.html`](index.html): a scripted day on the workflow ladder for one sensor head, every decision evaluated by URGE in the browser, shown as a phone line, a portlet bar and the raw stream |
| **Ledger** | [`ledger.json`](ledger.json), written by `node bin/run.mjs`; the page recomputes it and prints whether the two agree |
| **Judge** | URGE 0.1.1 as WebAssembly in [`urge/`](urge/), copied unchanged with its hashes |
| **Licence** | All rights reserved; patent pending. See [`LICENSE`](LICENSE) |

## The six

| Glyph | Identity | Does | Role | Class | Scheme |
|---|---|---|---|---|---|
| ⚖️ | Janus | verifies: every action, connection and record access gets a verdict | Security / Access Agent | non-evolving | 0 |
| 🐌 | Oonia | orchestrates: decomposes a request, routes each step, tracks it | Routing / Orchestrator Agent | non-evolving | 1 |
| 📖 | Hermes | speaks to the person: what happened and why, in their language | User's Personal Agent | non-evolving | 1 |
| 📚 | Curator | keeps the record: the ledger of traces, the clinical resources, the audit trail | the records role | non-evolving | 1 |
| ⭐ | Athena | advises: the domain knowledge, the pathway, the medication rule | Designer | evolving | 2 |
| 🔥 | Helios | composes: a workflow from parts, never executed unverified | Composer | evolving | 3 |

An evolving identity acts only after Janus has verified its output, cannot message another
evolving identity, and cannot create agents. Every line a device shows is therefore one of
three things: a non-evolving agent doing its fixed job, an evolving agent proposing, or the
verifier deciding.

## The line

```
<glyph> <Name> <verb> <object> <mark>        ⚖️ Janus verified secure connection ✓
```

✓ a valid verdict, ✗ an invalid one, … in progress, ? a verb the device does not know. The
mark is never truncated. A phone notification carries 40 characters, a desktop portlet 80;
a device with no screen sends the event up the stream.

## Running it

Open `index.html` from any static server. From the command line, Node 18 or later:
`node bin/run.mjs` writes the ledger, `node bin/run.mjs --check` compares it.

## Related

[igent](https://github.com/toneron2/igent) carries this specification by reference, with
its hash. [URGE](https://github.com/toneron2/URGE) evaluates every gate.
[broad](https://github.com/toneron2/broad) defines the roles.

## Contact

Tony Slosar · TODOMODO.IO AGENCY LLC · anthonyslosar@gmail.com · [t.me/toneron2](https://t.me/toneron2) · [slosars.me](https://slosars.me)
