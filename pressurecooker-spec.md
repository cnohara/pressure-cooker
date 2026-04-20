# PressureCooker — Full Technical Specification
> Version 1.0 — Ready for Claude Code implementation

---

## 1. Project Overview

**PressureCooker** is a single-user web application that runs an iterative LLM critique loop. Two LLMs are assigned roles — a Builder and a Critic — and take turns over N rounds to pressure-test a topic, plan, or idea until it is genuinely robust. The user can pause between rounds to steer the conversation manually.

The app is a personal productivity tool deployed publicly on Vercel. Each user brings their own OpenRouter API key. All API calls are made directly from the browser to OpenRouter — there is no custom backend.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | SvelteKit 2 | Latest stable |
| UI Library | Svelte 5 | Use runes: `$state`, `$derived`, `$effect` throughout |
| Styling | Tailwind CSS 4 | Utility-first, dark mode only |
| Deployment | Vercel | `@sveltejs/adapter-vercel` |
| API | OpenRouter | Direct browser fetch, `/v1/chat/completions` |
| Persistence | `localStorage` | API key + session history |
| Database | None | Not needed |
| Package Manager | pnpm | Preferred |

---

## 3. Design System

### 3.1 Theme
- **Dark mode only.** No light mode toggle. Background: `#0a0a0a`. Surface: `#111111`. Card: `#1a1a1a`. Border: `#2a2a2a`.
- **Accent colour:** A hot pressure orange — `#f97316` (Tailwind `orange-500`). Used for the logo, primary CTA, active states, and the live streaming indicator.
- **Typography:** Use `font-family: 'Berkeley Mono', 'JetBrains Mono', monospace` for the logo and round labels. Use `font-family: 'Inter', sans-serif` for all body text. Load both via `@fontsource` packages.
- **Branding:** A small pressure gauge icon (SVG inline) next to the wordmark "PressureCooker" in the nav. The gauge needle animates while a session is running.

### 3.2 Layout
- Single-page app. No routing beyond `/` and `/history`.
- Max content width: `860px`, centred.
- Nav: fixed top bar, 48px tall. Logo left. "History" link and API key status indicator right.
- Main content below nav with `pt-16` to clear it.

### 3.3 Component Aesthetic
- Cards use `rounded-xl border border-[#2a2a2a] bg-[#1a1a1a]`.
- Inputs: `bg-[#111] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600`.
- Primary button: `bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg`.
- Destructive/stop button: `bg-red-900 hover:bg-red-800 text-red-200 rounded-lg`.
- All transitions: `transition-all duration-200`.

---

## 4. Application Pages & Routes

### 4.1 `/` — Main Session Page
The only screen users interact with for running sessions. Contains:
1. Config Panel (top)
2. Pressure Cook button + cost estimate
3. Session Output (accordion rounds)
4. Summary Card (appended when session completes)

### 4.2 `/history` — Session History
Lists all past sessions stored in localStorage. Read-only. No re-run from here.

---

## 5. Config Panel

The config panel is visible at the top of `/`. It collapses once a session is running and re-expands when the session finishes or is stopped.

### 5.1 Fields (in order)

#### API Key Input
- Type: `<input type="password">`
- Label: "OpenRouter API Key"
- Placeholder: `sk-or-...`
- On blur: validate by calling `GET https://openrouter.ai/api/v1/auth/key` with the key as Bearer token. Show green checkmark if valid, red error if not. Store in `localStorage` key `pressurecooker_api_key` on valid.
- A subtle "Get a key →" link opens `https://openrouter.ai/keys` in a new tab.
- If a key is already stored, pre-fill and show as validated on page load.

#### LLM 1 — Model Selector
- Label: "Builder"
- A styled button showing the currently selected model name + provider logo (small SVG icon).
- Clicking opens the Model Picker Modal (see Section 7).
- Default: `anthropic/claude-sonnet-4-5` (or the first available Claude Sonnet from the fetched model list).

#### LLM 1 — Role Instruction
- Type: `<textarea>`, 4 rows
- Label: "Builder instruction"
- Placeholder: `You are an expert planner. Create a detailed, thorough plan for: {topic}. Consider all edge cases, interactions, and failure modes.`
- The string `{topic}` is a substitution token. Show a small info tooltip: "Use {topic} to insert the session topic."

#### LLM 2 — Model Selector
- Label: "Critic"
- Same as LLM 1 model selector.
- Default: `google/gemini-flash-1.5` (or first available Gemini Flash).

#### LLM 2 — Role Instruction
- Type: `<textarea>`, 4 rows
- Label: "Critic instruction"
- Placeholder: `You are a rigorous critic. Identify every flaw, gap, missed edge case, and logical error in this plan. Be thorough and specific. Do not suggest fixes — only identify problems.`

#### Topic
- Type: `<input type="text">`
- Label: "Topic"
- Placeholder: `A fully playable Godot platformer game`
- This value replaces `{topic}` in both role instructions at runtime.

#### Number of Rounds
- Type: `<input type="range">` with a numeric display beside it.
- Range: 1–10. Default: 3.
- Show the current value as a large number: e.g. `3 rounds`.

#### Summary Card Toggle
- Type: `<input type="checkbox">`, defaulted ON.
- Label: "Generate summary after final round"
- Sub-label: "(Uses a fast cheap model — cost included in estimate)"

#### Pause Between Rounds Toggle
- Type: `<input type="checkbox">`, defaulted OFF.
- Label: "Pause between rounds (lets you edit instructions)"
- When ON, a "Resume" button appears after each round completes, before the next one starts. While paused, both role instruction textareas become editable again for that session.

---

## 6. Cost Estimator

Displayed between the config panel and the Pressure Cook button. Updates live as the user changes models, rounds, or types in the topic/instructions.

### 6.1 Token Estimation Logic

```
estimated_input_tokens_per_call = 
  count_tokens(topic) + 
  count_tokens(instruction_for_that_role) + 
  (avg_round_output_tokens * rounds_completed_so_far * 2)  // history grows

estimated_output_tokens_per_call = 800  // fixed assumption, shown to user

total_calls = rounds * 2 + (summary_enabled ? 1 : 0)
```

Use a simple character-based token approximation: `Math.ceil(text.length / 4)`. This is clearly labelled as an estimate.

### 6.2 Cost Calculation

```
cost_llm1 = rounds * (
  (estimated_input_tokens / 1_000_000 * llm1_price_per_input_token) +
  (estimated_output_tokens / 1_000_000 * llm1_price_per_output_token)
)

cost_llm2 = rounds * (
  (estimated_input_tokens / 1_000_000 * llm2_price_per_input_token) +
  (estimated_output_tokens / 1_000_000 * llm2_price_per_output_token)
)

cost_summary = summary_enabled ? 
  (800 / 1_000_000 * summary_model_input_price + 800 / 1_000_000 * summary_model_output_price) : 0

total_estimated_cost = cost_llm1 + cost_llm2 + cost_summary
```

### 6.3 Display

```
Estimated cost: ~$0.047   [LLM1: $0.031  |  LLM2: $0.014  |  Summary: $0.002]
Based on ~800 output tokens/response. Actual cost may vary.
```

Show in a muted small line, orange accent for the total amount.

Context window warning: if `estimated_total_tokens_at_final_round > 0.8 * model_context_window`, show a yellow warning badge: "⚠ Round N may approach context limit for [Model Name] ([X]K tokens)."

---

## 7. Model Picker Modal

Triggered by clicking either model selector button. Appears as a full-screen overlay on mobile, a centred modal (560px wide, max 70vh tall) on desktop.

### 7.1 Data Source

On app load, fetch: `GET https://openrouter.ai/api/v1/models`

No auth header required for the public model list. Cache the response in memory for the session (do not re-fetch on each modal open). Store model list in a Svelte 5 `$state` at the module level.

Each model object from the API includes:
- `id` — e.g. `anthropic/claude-sonnet-4-5`
- `name` — display name
- `pricing.prompt` — USD per token (input)
- `pricing.completion` — USD per token (output)
- `context_length` — max tokens
- `description`

### 7.2 Layout

**Header:** "Select a model" title + close (×) button.

**Search input:** Full-width, autofocused on modal open. Filters the model list live as the user types. Searches across `id` and `name`.

**Tabs:** Two tabs — "Popular" (default) and "All Models".

**Popular tab** — hardcoded curated list of ~20 models, grouped by provider:

```
Anthropic
  claude-opus-4  
  claude-sonnet-4-5
  claude-haiku-4-5

OpenAI
  openai/gpt-4o
  openai/gpt-4o-mini
  openai/o3-mini

Google
  google/gemini-2.0-flash-001
  google/gemini-2.5-pro-preview

Meta
  meta-llama/llama-3.3-70b-instruct
  meta-llama/llama-3.1-8b-instruct

Mistral
  mistralai/mistral-large
  mistralai/mistral-small

DeepSeek
  deepseek/deepseek-r1
  deepseek/deepseek-chat-v3-0324

Qwen
  qwen/qwen-2.5-72b-instruct
```

If any of these IDs don't exist in the live API response, omit them silently.

**All Models tab** — full list from the API, sorted by provider then model name. Filtered by the search input.

**Model row (both tabs):**
```
[Provider Logo 16px]  Model Name                    $X.XX / $X.XX per 1M
                      provider/model-id             [context]K ctx
```
- Left: provider logo (small SVG or text abbreviation in a badge)
- Centre: display name + model ID in muted smaller text
- Right: input price / output price per 1M tokens. If price is 0, show "Free" in green.
- Context length shown as e.g. `128K ctx`
- Currently selected model has an orange left border accent.
- Hover: subtle `bg-[#222]` highlight.
- Click: selects the model, closes modal.

### 7.3 Provider Logo Mapping

Map provider prefix to a coloured text badge (no external images needed):
```
anthropic → [A]  bg-orange-950 text-orange-300
openai    → [O]  bg-green-950  text-green-300
google    → [G]  bg-blue-950   text-blue-300
meta      → [M]  bg-purple-950 text-purple-300
mistral   → [Mi] bg-indigo-950 text-indigo-300
deepseek  → [D]  bg-cyan-950   text-cyan-300
qwen      → [Q]  bg-rose-950   text-rose-300
(default) → [·]  bg-gray-800   text-gray-400
```

---

## 8. Session Execution Engine

### 8.1 Starting a Session

**Validation before start:**
1. API key must be set and validated.
2. Both model selectors must have a selection.
3. Both role instructions must be non-empty.
4. Topic must be non-empty.

If any validation fails, highlight the offending field with a red border and scroll to it. Do not show a modal — inline errors only.

On valid start:
- Config panel animates closed (collapse with CSS transition).
- Session state is initialised (see 8.2).
- Round 1 begins immediately.

### 8.2 Session State (Svelte 5 runes)

```typescript
type RoundOutput = {
  roundNumber: number
  builderOutput: string        // streams in live
  criticOutput: string         // streams in live
  builderTokensUsed: number    // from usage field in response
  criticTokensUsed: number
  actualCost: number
  status: 'pending' | 'builder_streaming' | 'critic_streaming' | 'complete' | 'paused'
}

type SessionState = {
  id: string                   // uuid, generated at start
  topic: string
  llm1Model: string
  llm2Model: string
  llm1Instruction: string
  llm2Instruction: string
  totalRounds: number
  rounds: RoundOutput[]
  summaryEnabled: boolean
  summaryOutput: string
  summaryStatus: 'idle' | 'streaming' | 'complete'
  status: 'idle' | 'running' | 'paused' | 'complete' | 'stopped' | 'error'
  startedAt: string            // ISO timestamp
  completedAt: string | null
  totalActualCost: number
  errorMessage: string | null
}
```

### 8.3 Round Execution Loop

```
for round = 1 to N:
  1. Create RoundOutput with status 'builder_streaming'
  2. Build messages array for LLM1 (see 8.4)
  3. Call OpenRouter streaming API with LLM1 model
  4. Stream tokens into round.builderOutput
  5. On stream complete: set builder tokens used, update status to 'critic_streaming'
  6. Build messages array for LLM2 (see 8.4)
  7. Call OpenRouter streaming API with LLM2 model
  8. Stream tokens into round.criticOutput
  9. On stream complete: set critic tokens used, update status to 'complete'
  10. Calculate and store actual round cost
  11. Collapse this round card (animate closed)
  12. If pauseBetweenRounds is ON: set session status to 'paused', stop loop
      → User clicks Resume → continue loop
  13. If round < N: open next round card, repeat

After final round (or if summary disabled, skip to save):
  14. If summaryEnabled: run summary call (see 8.6), stream into summaryOutput
  15. Set session status to 'complete'
  16. Save session to localStorage
  17. Show final actual cost
```

### 8.4 Message History Construction

**LLM1 (Builder) messages for round R:**

```
System: [LLM1 instruction with {topic} substituted]

User (round 1 only):   "The topic is: {topic}. Begin."
Assistant (round 1):   [LLM1 round 1 output — from previous round]

User (rounds 2+):      "The critic has reviewed your plan. Here is their critique:

---
{LLM2 round R-1 output}
---

Revise your plan to address these criticisms. Be thorough."
Assistant (rounds 2+): [LLM1 round R output — from previous round if exists]

... repeat for all previous rounds ...

User (current round trigger):  "Continue." (round 1) or "Revise based on the critique above." (rounds 2+)
```

**LLM2 (Critic) messages for round R:**

```
System: [LLM2 instruction with {topic} substituted]

User:       "Here is the plan to critique:

---
{LLM1 round R output}
---

Provide your critique."
```

The Critic does not receive history from previous rounds — only the current round's Builder output. This keeps the Critic fresh and unanchored to prior critiques.

### 8.5 Context Window Guard

Before each API call, estimate the total tokens in the messages array using `Math.ceil(total_chars / 4)`. If this exceeds `0.85 * model_context_window`:
- Show a non-blocking toast warning: "Round [N] is approaching the context limit for [Model]. Output may be truncated."
- Do not abort — proceed with the call.

### 8.6 Summary Call

After the final round completes (if enabled):

```
Model: Auto-select cheapest model from the popular list with price > 0
       (or hardcode 'google/gemini-flash-1.5' as default)

System: "You are a concise analyst."

User: "Below is a multi-round plan refinement session. The topic was: {topic}.

Round 1 Plan:
{round1_builder_output}

Round 1 Critique:
{round1_critic_output}

[... repeat for all rounds ...]

Final Plan (Round {N}):
{roundN_builder_output}

Please provide:
1. What meaningfully improved across the rounds
2. What the critic consistently flagged
3. What remains unresolved or uncertain in the final plan
Keep your response under 400 words."
```

Stream the summary output into the Summary Card.

### 8.7 Stopping a Session

A "Stop" button (red) is visible while a session is running. On click:
- Immediately cancel any active fetch (use `AbortController`).
- Set session status to `'stopped'`.
- Mark the current incomplete round as `status: 'complete'` with whatever text was streamed so far.
- Save the partial session to localStorage.
- Show config panel again.
- Display: "Session stopped. Partial output saved to history."

### 8.8 Error Handling

All errors must be non-destructive — preserve all completed round outputs.

| Error | Behaviour |
|---|---|
| Invalid API key (401) | Show inline error below key input. Abort session. |
| Rate limited (429) | Show toast: "Rate limited. Retrying in Xs..." with countdown. Auto-retry after the `retry-after` header value (default 10s if header absent). Max 3 retries. |
| Stream dropped / network error | Show in-round error: "Stream interrupted. [Retry] [Stop]". Retry restarts that specific round's API call. |
| Model not found (404) | Show toast: "Model [id] not available. Please select another." Abort session. |
| Context too large (400 with context error) | Show in-round error: "Context limit exceeded for [Model]. Consider using a model with a larger context window." Abort session. |
| Unknown error | Log to console. Show: "Unexpected error. See console for details. [Stop]" |

---

## 9. Session Output UI

### 9.1 Round Accordion

Each round is rendered as a collapsible card.

**Expanded state (active round):**
```
┌─────────────────────────────────────────────────────────┐
│  Round 2 of 5          ● Builder streaming...     [Stop] │
├──────────────────────────┬──────────────────────────────┤
│  🔨 Builder              │  🔍 Critic                   │
│  claude-sonnet-4-5       │  gemini-flash-1.5            │
│                          │                              │
│  [streaming text...]     │  Waiting for builder...      │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘
```

- Two-column layout (50/50) on desktop.
- Stacked layout (Builder on top, Critic below) on mobile (< 640px).
- A thin orange animated border pulses on the actively streaming panel.
- The inactive panel shows "Waiting for builder..." or "Waiting for critic..." in muted text.
- Text streams in with a blinking cursor `|` at the end of the streamed content.
- Markdown rendered via `marked` or `@humanwhocodes/markdown-it` — the LLMs will output headers, bullet points, etc.

**Collapsed state (completed round):**
```
┌──────────────────────────────────────────────────────────────────┐
│  Round 1  ✓    Builder: first 80 chars of output...   [$0.018] ▼ │
└──────────────────────────────────────────────────────────────────┘
```

- Single row showing: round number + checkmark, first ~80 chars of builder output as preview, actual cost, expand chevron.
- Clicking anywhere on the row expands the full two-column view.
- Copy icon appears on hover to copy the full builder output for that round.

**Paused state (between rounds, pause mode ON):**
```
┌────────────────────────────────────────────────────────┐
│  Round 2 is ready                                      │
│                                                        │
│  Builder instruction (editable):                       │
│  [textarea — pre-filled with original instruction]     │
│                                                        │
│  Critic instruction (editable):                        │
│  [textarea — pre-filled with original instruction]     │
│                                                        │
│  [  Resume Round 2  ]   [  Stop Session  ]             │
└────────────────────────────────────────────────────────┘
```

Changes to instructions in pause mode only affect subsequent rounds — they do not modify the stored session config.

### 9.2 Progress Bar

Displayed above the rounds, visible while session is running or paused:

```
Round 3 of 5   ████████████░░░░░░░░   60%   Elapsed: 1m 23s
```

- Orange fill, animated smooth progress.
- Shows elapsed time since session start.
- Disappears on session complete.

### 9.3 Summary Card

Appears below all round cards after the final round completes (if enabled).

```
┌────────────────────────────────────────────────────────┐
│  ✦ Session Summary                    [Copy] [Export]  │
│  Generated by gemini-flash-1.5                         │
│                                                        │
│  [streaming summary text...]                           │
│                                                        │
│  Total actual cost: $0.052                             │
│  Rounds: 5  |  Models: claude-sonnet-4-5 + gemini-1.5  │
└────────────────────────────────────────────────────────┘
```

### 9.4 Copy & Export

**Per-round copy:** On hover over a completed round, a copy icon appears in the top-right of the Builder panel. Copies the Builder's full plain text output for that round.

**Final output copy:** A prominent "Copy Final Plan" button appears on the last completed round card (Builder side only).

**Export full session:** A button in the Summary Card (and also in the history view). Exports as a `.md` file with this structure:

```markdown
# PressureCooker Session
**Topic:** {topic}
**Date:** {timestamp}
**Models:** {llm1_model} (Builder) vs {llm2_model} (Critic)
**Rounds:** {n}
**Total Cost:** ${actual_cost}

---

## Builder Instruction
{llm1_instruction}

## Critic Instruction
{llm2_instruction}

---

## Round 1

### Plan
{round1_builder_output}

### Critique
{round1_critic_output}

---

## Round 2
...

---

## Summary
{summary_output}
```

Trigger download via `URL.createObjectURL(new Blob([content], { type: 'text/markdown' }))`.

---

## 10. Session History

### 10.1 Storage Format

Key: `pressurecooker_sessions` in localStorage.
Value: JSON array of `SessionState` objects, capped at the last 20 sessions (oldest removed first).

On session complete or stop: push to array and save.

Max localStorage size guard: if saving would exceed 4MB (estimate by checking `JSON.stringify(sessions).length`), remove the oldest session before adding the new one.

### 10.2 History Page (`/history`)

- List of session cards, newest first.
- Each card shows: topic, date/time, models used, number of rounds completed, total cost, status badge (Complete / Stopped / Error).
- Clicking a card navigates to a read-only view of that session (same accordion UI, all rounds expanded by default, no streaming — just static text).
- A "Delete" icon on each card (confirm on click).
- A "Clear all history" button at the top (with confirmation dialog).
- "Export" button per card — downloads the session as `.md`.

---

## 11. OpenRouter API Integration

### 11.1 Streaming Call

```typescript
async function* streamCompletion(
  apiKey: string,
  model: string,
  messages: {role: string, content: string}[],
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://pressurecooker.app',
      'X-Title': 'PressureCooker'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 2000
    }),
    signal: abortSignal
  })

  if (!response.ok) {
    const error = await response.json()
    throw new OpenRouterError(response.status, error)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
    
    for (const line of lines) {
      const data = line.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch { /* ignore parse errors on partial chunks */ }
    }
  }
}
```

### 11.2 Usage Extraction

After streaming completes, make a follow-up call to get actual token usage (OpenRouter's streaming responses may not include usage):

```
GET https://openrouter.ai/api/v1/generation?id={generation_id}
```

The generation ID is available in the streaming response chunks as `id`. Store it. After stream ends, fetch the generation stats and extract `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_cost`.

If this follow-up call fails, fall back to the character-based estimate.

### 11.3 Model List Fetch

```typescript
async function fetchModels(apiKey?: string): Promise<OpenRouterModel[]> {
  // No auth required for public model list
  const res = await fetch('https://openrouter.ai/api/v1/models')
  const data = await res.json()
  return data.data
}
```

Call this once on app load. Store in module-level `$state`. Show a loading skeleton in the model picker until resolved.

---

## 12. Markdown Rendering

Install `marked` (`pnpm add marked`). Configure with:
- `gfm: true` (GitHub Flavoured Markdown — tables, strikethrough)
- `breaks: true` (newlines become `<br>`)

Apply a custom CSS class `prose` to the rendered output container:

```css
.prose {
  color: #e2e8f0;
  line-height: 1.7;
  font-size: 0.9rem;
}
.prose h1, .prose h2, .prose h3 { color: #f1f5f9; font-weight: 600; margin: 1em 0 0.5em; }
.prose ul, .prose ol { padding-left: 1.5em; }
.prose code { background: #1e293b; padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.85em; }
.prose pre { background: #1e293b; padding: 1em; border-radius: 8px; overflow-x: auto; }
.prose blockquote { border-left: 3px solid #f97316; padding-left: 1em; color: #94a3b8; }
.prose table { border-collapse: collapse; width: 100%; }
.prose td, .prose th { border: 1px solid #2a2a2a; padding: 0.4em 0.75em; }
.prose th { background: #1e293b; }
```

Render markdown incrementally during streaming: re-parse and re-render the full accumulated string on each chunk. This is fine at 800-token outputs.

---

## 13. File & Folder Structure

```
pressurecooker/
├── src/
│   ├── app.html
│   ├── app.css               # Tailwind base + custom prose styles
│   ├── lib/
│   │   ├── api/
│   │   │   ├── openrouter.ts # streamCompletion, fetchModels, validateKey, fetchGeneration
│   │   │   └── types.ts      # OpenRouterModel, OpenRouterError, SessionState, RoundOutput
│   │   ├── stores/
│   │   │   ├── session.svelte.ts   # $state for active session, session actions
│   │   │   ├── models.svelte.ts    # $state for model list, loading state
│   │   │   └── history.svelte.ts   # $state for localStorage sessions, CRUD
│   │   ├── utils/
│   │   │   ├── tokens.ts     # estimateTokens, estimateCost
│   │   │   ├── export.ts     # sessionToMarkdown, downloadFile
│   │   │   └── storage.ts    # loadKey, saveKey, loadSessions, saveSessions
│   │   └── components/
│   │       ├── Nav.svelte
│   │       ├── ConfigPanel.svelte
│   │       ├── ModelPickerModal.svelte
│   │       ├── ModelPickerRow.svelte
│   │       ├── CostEstimate.svelte
│   │       ├── RoundCard.svelte          # accordion card
│   │       ├── StreamingPanel.svelte     # one LLM's output panel
│   │       ├── ProgressBar.svelte
│   │       ├── SummaryCard.svelte
│   │       ├── PauseOverlay.svelte
│   │       └── HistoryCard.svelte
│   └── routes/
│       ├── +layout.svelte    # Nav + global styles
│       ├── +page.svelte      # Main session page
│       └── history/
│           └── +page.svelte  # Session history
├── static/
│   └── favicon.svg           # Pressure gauge icon
├── svelte.config.js          # adapter-vercel
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 14. Environment & Configuration

No `.env` file required — the API key is user-provided at runtime and stored in localStorage.

`svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() }
}
```

`package.json` key dependencies:
```json
{
  "dependencies": {
    "@sveltejs/adapter-vercel": "latest",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0",
    "marked": "^12.0.0",
    "tailwindcss": "^4.0.0",
    "@fontsource/inter": "^5.0.0",
    "uuid": "^10.0.0"
  }
}
```

---

## 15. Responsive Breakpoints

| Breakpoint | Change |
|---|---|
| `< 640px` (mobile) | Round card: stacked panels (Builder above Critic). Model picker: full-screen overlay. Config panel fields: full width. |
| `640–860px` (tablet) | Round card: side-by-side but tighter. |
| `> 860px` (desktop) | Full two-column round cards. Centred 860px content max-width. |

---

## 16. Accessibility

- All interactive elements have visible focus rings (`focus-visible:ring-2 ring-orange-500`).
- Model picker modal traps focus while open. Closes on Escape key.
- Round cards toggle on Enter/Space when focused.
- `aria-live="polite"` on streaming text containers so screen readers announce updates.
- `aria-expanded` on accordion triggers.
- `role="status"` on the progress bar.

---

## 17. Performance Notes

- Model list (300+ items) is fetched once and cached in memory. The modal filters client-side — no re-fetch on each open.
- Streaming text is appended to a string in `$state`. Re-rendering on each token is fast in Svelte 5 (fine-grained reactivity — only the text node updates).
- Markdown is re-parsed on each chunk but `marked` is synchronous and fast for 800-token strings. No debounce needed.
- `localStorage` writes happen only on session complete/stop, not during streaming.

---

## 18. Known Limitations (document for future)

- No multi-user support (by design — BYOK personal tool).
- No cross-device session sync.
- Context window accumulates history — very long sessions with expensive models may become costly. The context guard warning (Section 8.5) addresses this but does not prevent it.
- Summary model is hardcoded, not user-selectable in v1.
- No audio notifications when a long session completes.

---

## 19. Launch Checklist

Before deploying to Vercel:

- [ ] `adapter-vercel` installed and configured in `svelte.config.js`
- [ ] No hardcoded API keys anywhere in source
- [ ] `HTTP-Referer` header set to production domain in API calls
- [ ] Test with a real OpenRouter key end-to-end locally
- [ ] Test stop/abort mid-stream
- [ ] Test pause/resume flow
- [ ] Test localStorage limit guard (simulate 20 sessions)
- [ ] Test on mobile viewport (375px)
- [ ] Test model picker search with 300 models
- [ ] Test export markdown download
- [ ] Verify cost estimate matches actual cost within ~20%
- [ ] Push to GitHub → connect Vercel → deploy

---

*End of specification. Hand this document to Claude Code and instruct it to implement the full working prototype locally with `npm run dev` / `pnpm dev`.*
