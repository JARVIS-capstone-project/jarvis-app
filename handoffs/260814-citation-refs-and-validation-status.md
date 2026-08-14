# FE Changes — Citation Refs + Validation Status

Record of what actually shipped. Commit `7407e5e` on `dev`, 11 files, +601 / −162.

Plan: [plan.md](../../plans/260814-1113-citation-refs-and-validation-status/plan.md) · Phases:
[01](../../plans/260814-1113-citation-refs-and-validation-status/phase-01-citation-refs-section.md) ·
[02](../../plans/260814-1113-citation-refs-and-validation-status/phase-02-inline-citation-styling.md) ·
[03](../../plans/260814-1113-citation-refs-and-validation-status/phase-03-validation-status-flow.md)

Paths in the tables below are relative to `src/`.

## What the user sees now

| Before | After |
|---|---|
| Answer text only | Source list under every assistant answer, each with a trust badge |
| `[label](cite:id)` rendered as a dead link (opened a blank tab) | Bold brand-coloured text, not clickable |
| Status pane showed thinking headings only | Also shows what the faithfulness gate did, one line per 0.8 s |

Three BE signals that were already on the wire and dropped on the floor. No BE change was
needed for any of it.

## Files

### New

| File | Purpose |
|---|---|
| `model/status-stream.ts` | One frame→status-line producer for both the send and resume paths. Owns the thinking buffer. |
| `ui/components/citation-list.tsx` | The source list. Presentational, no state. |

### Renamed

`model/thinking-queue.ts` → `model/status-queue.ts` — `ThinkingQueue`→`StatusQueue`,
`addThinking`→`addStatus`, `onThinking`→`onStatus`. The class carries validation now; the old
name had stopped being true.

### Modified

| File | Change |
|---|---|
| `api/agent-types.ts` | `CitationRef` DTO; `citation_refs` on `MessageTurnDTO` + `turn_end`; 4 `validation_*` frames on `SseFrame` |
| `model/types.ts` | `StatusLine {kind, text}` + `StatusLineKind`; `ChatMessage.thinking` → `status`; `citationRefs` |
| `model/chat-session-store.ts` | `setLastAssistantThinking` → `setLastAssistantStatus`; new `setLastAssistantCitations` |
| `model/use-hydrate-session.ts` | map `dto.turn?.citation_refs` |
| `model/use-chat-send.ts` | both frame handlers collapsed to `if (status.accept(frame)) return`; citation write on `turn_end` |
| `ui/components/message-bubble.tsx` | `ThinkingHeading` → `StatusLineView`; mounts `CitationList` |
| `shared/ui/markdown.tsx` | `CITE_SCHEME`, custom `urlTransform`, `cite:` branch in the `a` override |

## Key mechanics

**Status pane ordering.** `StatusQueue` paces one line per `MIN_DISPLAY_MS = 800` and holds
`text_delta` until the queue drains — the answer can never overtake the status it belongs to.
Validation frames arrive in the same wire position as thinking (after tools, before text), so
they needed a second producer, not new machinery.

**`StatusLine.kind` exists because the renderer used to parse.** The old `ThinkingHeading`
extracted the last `**Heading**` and fell back to the literal word `"Thinking…"`. Validation
messages carry no `**`, so every one of them would have rendered as `"Thinking…"`. Now the
producer supplies display-ready text and `kind` only picks the tone.

**`cite:` needs `urlTransform`, not just the override.** `react-markdown` runs
`defaultUrlTransform` over `href` *before* a component override sees it; its allow-list is
`http(s) | irc(s) | mailto | xmpp`. See defect C1 below.

**`file_status` is authoritative, `kind` is not.** Per the BE schema: `kind` picks the icon
(`FileText` / `Paperclip`), `file_status` picks the badge. A source type added later (web, MCP)
will set `file_status` without changing what `kind` means.

**The gate is conditional.** `_judgeable()` stands it down when the answer is empty, nothing was
retrieved, or the answer trips `is_refusal`. A turn can go `tool_result` → `text_delta` with no
`validation_*` frame at all. Nothing waits on `validation_result`.

## Defects found in review, all fixed

Six. Two changed the design, not just the code.

**C1 — critical. Phase 02 shipped inert.** Every `cite:` href arrived as `''` because
`defaultUrlTransform` blanks non-allow-listed schemes before the override runs, so the branch
never fired. Worse than a dead link: `href=""` resolves to the current document, so a citation
click opened a second copy of the SPA. Verified against the installed package rather than
assumed (`"cite:rules/thresholds.md" => ""`), fixed with a custom `urlTransform`, re-verified
that `javascript:` still blanks.

**H1 — high. The gate's `reason` was never shown.** `dispose()` cleared the timer and discarded
the queue. On a gated turn the verdict lands one frame before `turn_end`, so the `reason` line —
the most load-bearing sentence the gate produces — was reliably dropped. Split into `finish()`
(drain, then settle) and `abandon()` (drop, for a failed or aborted turn); clearing the status
line and re-enabling the composer moved into the settle callback.

| # | Defect | Fix |
|---|---|---|
| H2 | Each `thinking_delta` wire chunk took its own 800 ms window; a chunk with no complete `**…**` rendered as the bare word "Thinking…" | Accumulate into a buffer, enqueue only when the extracted heading changes |
| M1 | A rolled-back turn showed green "Verified" badges under a refusal | Guard the citation write on `!rolled_back`, both paths |
| M2 | "Found N sources in the knowledge base" — but N counts the user's own uploads, the untrusted half of the distinction this pane exists to draw | `Checked N source(s)`, with a `typeof === 'number'` guard |
| M3 | Send and resume carried duplicate frame-handling that had already drifted | Unified in `status-stream.ts` |

Self-inflicted and caught before commit: a hard-coded `id="citation-list-label"` would have
collided across messages → `useId()`.

## Decisions

Settled with the user — do not re-litigate.

1. `validation_result` renders as **two** 0.8 s steps: `message`, then `reason`. Empty `reason`
   is skipped rather than spending a window on a blank line.
2. `validation_error` renders in a **warning tone**. A broken judge must not read as a clean
   bill of health.
3. Status lines **vanish** when the answer starts. The durable trust signal is the citation
   list.
4. **Nothing is clickable** — not the list, not the inline markers.
5. **`confidence_score` is not displayed.** See below.

### Why confidence_score was dropped

Investigated after the cook run, decided against.

The field carries **two different quantities under one name**. When the faithfulness gate does
not run it is a 4-factor shape score (`0.40` evidence tool · `0.30` has citations · `0.15`
source diversity · `0.15` tool count) — only 21 discrete values, step 0.05, max 1.0 — and it
measures process hygiene, not correctness. When the gate runs, `_blend_gate` overwrites it with
`supported / (supported + unsupported)`.

`confidence_breakdown` is the only discriminator, and it is **not persisted** — no column on
`audit_records`, not on `TurnMetrics`. It exists solely on the live `turn_end` frame. So after a
reload the FE holds a bare float with no way to know which meaning it carries, and the two
ranges overlap at exactly the common values (`0.5`, `0.75`, `0.8`, `1.0` are reachable by both).
`0.8` is either "4 of 5 claims supported" or "ran 1 tool, read 1 source".

The BE's own docstring names the failure mode: *"A model can retrieve the right runbook, cite it
correctly, score 0.9, and still state a root cause that appears nowhere in it."* Rendering that
score as "confidence" advertises the exact failure the gate was built to catch.

Citation list + validation pane + `requires_escalation` already tell the story, and none of them
changes meaning on reload.

**To revisit this** the BE would need `confidence_breakdown` persisted (one JSONB column +
one `TurnMetrics` field). Then it can be shown as self-explanatory prose — "4 of 5 claims
supported" — instead of a float.

### Why severity is not shown per message

`_resolve_severity` classifies once on the first turn and writes it to the session; later turns
reuse it. It is constant across a session unless the user PATCHes it — so a per-message badge
would repeat the same value under every bubble. It belongs in the session header.

Also: severity's only effect on confidence is setting the escalation bar (P1 0.75 / P2 0.70 /
P3 0.60 / P4 0.55), that comparison already ships as `requires_escalation`, and the threshold
table is not on the wire at all.

## Verification

No runtime testing — GCS quota. Static only.

```
bun run typecheck   pass
bun run lint        pass (0 errors, 0 warnings)
bun run build       pass, no chunk warning
```

Main bundle 314.78 kB gzip, up 0.94 kB from 313.84 for all three features.

## Open questions for the Agent team

1. `label` is a raw KB path (`incidents/payments/inc-2026-0214-swift-sag-cold-start-queue-loss.md`).
   The resolved human title exists but only inside `validation_sources`, a different frame.
   Can `CitationRef.label` carry the title?
2. Two marker shapes survive the rewriter and render as literal text: `[a.md, b.md]` (one id per
   bracket) and `[rules/thresholds.md]` (id not in this turn's retrieved set). Expected, or worth
   closing BE-side?
3. Persist `confidence_breakdown` — worth it, or leave confidence out of the UI permanently?
