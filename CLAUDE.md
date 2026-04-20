# PressureCooker — Claude Code Guide

## What this is
A single-user SvelteKit app that runs iterative LLM critique loops via OpenRouter. Two models take roles — **Builder** (creates/refines a plan) and **Critic** (finds flaws) — for N rounds, then optionally generates a summary. No backend; all API calls are browser-side. Users bring their own OpenRouter key.

## Commands
```bash
pnpm dev          # dev server at http://localhost:5173
pnpm build        # production build (adapter-vercel)
pnpm preview      # preview production build locally
```

## Stack
- **SvelteKit 2** + **Svelte 5 runes** (`$state`, `$derived`, `$derived.by`, `$effect`)
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin — dark mode only
- **OpenRouter** — direct browser fetch to `/v1/chat/completions` (streaming SSE)
- **pnpm** — package manager
- `marked` for markdown rendering, `uuid` for session IDs, `@fontsource/inter` for fonts

## Key Svelte 5 rules (avoid past mistakes)
- **`$derived.by(() => { ... })`** for multi-line derived computations — NOT `$derived(() => ...)` which stores the *function itself* as the value
- **`{@render snippetName(args)}`** to call snippets — NOT `<SnippetName ... />` (that tries to find a component)
- Module-level `$state` in `.svelte.ts` files is reactive when accessed inside `$derived`/`$effect`

## File structure
```
src/lib/
  api/
    openrouter.ts   # streamCompletion, fetchModels, validateKey, fetchGeneration
    types.ts        # SessionState, RoundOutput, OpenRouterModel, OpenRouterError
  stores/
    session.svelte.ts  # active session state + execution engine (startSession, stopSession, etc.)
    models.svelte.ts   # OpenRouter model list (fetched once on load)
    history.svelte.ts  # localStorage session history
  utils/
    tokens.ts       # estimateTokens, estimateCost
    storage.ts      # localStorage helpers
    export.ts       # sessionToMarkdown, downloadFile
  components/
    ConfigPanel.svelte       # API key, model pickers, instructions, topic, rounds
    ModelPickerModal.svelte  # searchable model list from OpenRouter API
    RoundCard.svelte         # collapsible accordion per round
    StreamingPanel.svelte    # one side (Builder or Critic) with live markdown render
    PressureCookerViz.svelte # pixel-art pot + convergence pressure gauge
    ProgressBar.svelte       # round N of N + elapsed time
    SummaryCard.svelte       # post-session summary with copy/export
    CostEstimate.svelte      # live cost estimate from model pricing
    HistoryCard.svelte       # single card on /history
    Nav.svelte, ProviderBadge.svelte

src/routes/
  +layout.svelte    # Nav + toast notifications + init models/history
  +page.svelte      # main session page
  history/
    +page.svelte    # session history list + detail view
```

## Session execution flow
1. `startSession()` in `session.svelte.ts` runs the Builder→Critic loop
2. Each round: Builder streams → Critic streams → parse `CONVERGENCE: N` score from critic output (then strip it)
3. Both models receive round-awareness context in their system prompt (`[ROUND X OF N — Y remaining]`)
4. On complete: optional summary call, then `saveToHistory()`
5. `AbortController` handles stop mid-stream

## Convergence Pressure system
The Critic always ends its response with `CONVERGENCE: <0-100>` (injected via system prompt). This is:
- Parsed by `parseConvergenceScore()`
- Stripped from displayed `criticOutput` by `stripConvergenceLine()`
- Stored as `round.convergenceScore`
- Visualised in `PressureCookerViz` as a needle gauge + round dot trail

## LocalStorage keys
- `pressurecooker_api_key` — OpenRouter API key
- `pressurecooker_sessions` — JSON array of `SessionState`, capped at 20, max 4MB

## Deployment
Configured for Vercel via `@sveltejs/adapter-vercel`. No env vars needed (key is user-provided at runtime).
