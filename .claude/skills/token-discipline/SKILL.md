---
name: token-discipline
description: How to run Claude Code sessions that cost less without getting worse answers — delegating bulk reading to cheaper models, keeping the context clean, planning before prompting, choosing effort levels, one task per chat, and deleting prompt boilerplate written for older models. Use this whenever the user mentions token cost, burning credits, context limits, "this is getting expensive", subagent or sub-agent delegation, model choice for cost reasons, prompt caching, effort levels, or asks how to work more efficiently with Claude — even if they only hint at it by complaining that a session is slow, bloated, or repeating itself.
---

# Token discipline

Cheaper sessions come from three things, in this order: **not re-sending what the model
already has** (caching), **not reading what does not need reading** (delegation and
scope), and **not thinking harder than the task deserves** (effort). Most advice online
inverts this order and leads with model-swapping, which is the weakest of the three and
the only one that can cost you quality.

Judge everything by **cost per completed task, not per request.** A cheaper request that
needs three more turns to get the job done is not cheaper.

## Verify prices before you quote them

Model IDs and per-token prices change often enough that a number recalled from training
is probably stale. Before telling anyone what a change will save, load the `claude-api`
skill and read its Current Models table, or query the Models API. Say "roughly" until you
have checked.

At the time of writing, first-party API rates per million tokens:

| Model | Input | Output | vs Opus 5 |
| --- | --- | --- | --- |
| Opus 5 (`claude-opus-5`) | $5 | $25 | — |
| Sonnet 5 (`claude-sonnet-5`) | $2 | $10 | **60% less** |
| Haiku 4.5 (`claude-haiku-4-5`) | $1 | $5 | **80% less** |

Cache reads run about a tenth of the input rate. **That is where the ~90% figure people
quote actually comes from — caching, not model choice.** Anyone who attributes 90% to
swapping Opus for Sonnet has conflated the two; the real number for that swap is 60%, and
only on the tokens you actually move.

## The levers, strongest first

### 1. Prompt caching — the only lever that is free

Caching is the one change that costs nothing in quality. Everything below trades
something.

Caching is a **prefix match**: any byte that changes invalidates everything after it.
Render order is `tools` → `system` → `messages`. So keep the stable material first — a
frozen system prompt, a deterministically ordered tool list — and let the volatile
material (timestamps, request IDs, the actual question) sit after the last breakpoint.

The usual silent killers are a `datetime.now()` in a system prompt, a tool list whose
order varies between runs, and JSON serialised with unsorted keys. Check
`usage.cache_read_input_tokens`; if it is zero across requests that ought to share a
prefix, one of those is happening.

In a Claude Code session the equivalent move is **not disturbing the top of the
conversation**. Re-reading a file you already read, or re-stating the task, pushes new
bytes into a place that used to be cached.

### 2. Keep the context clean before you start

Every connector, MCP server, plugin and skill in the session contributes its tool schemas
to the context on **every single request** — not once. A dozen unused MCP tools is a
standing tax on the whole conversation.

Turn off what this task does not need. The saving compounds with conversation length,
which makes it worth thirty seconds at the start of a long session and worth nothing at
the end of a short one.

### 3. Decide the effort level deliberately

`output_config: {effort: ...}` takes `low`, `medium`, `high`, `xhigh`, `max`; the default
is `high`. It controls how much the model thinks and therefore how much it spends, within
one model.

- `low` for subagents, mechanical edits, and final tweaks — fewer tool calls, less
  preamble, terser confirmations.
- `high` is the usual sweet spot.
- `xhigh` for coding and long-horizon agentic work, where it earns its cost.
- `max` only when correctness matters more than money, and only after measuring that
  there is headroom at the level below.

**Correction worth knowing:** changing top-level `effort` mid-conversation **does**
invalidate the messages cache. The claim that you can drop to low effort late in a chat
"without breaking the cache" is only true through a specific mechanism — a per-message
effort system message (beta `mid-conversation-output-config-2026-07-01`), available on
Claude Opus 5, Fable 5.1 and Mythos 5.1. Without that beta, dropping effort at turn 40
throws away the cached prefix, and the invalidation can cost more than the effort change
saves. Set effort at the start when you can.

### 4. Try lower effort on the strong model before you build a cascade

This is the step most cost advice skips, and it is usually the right answer.

Lower effort on a current model often matches or beats a previous-generation model at
high effort. One model also means **one cache namespace** — caches are model-scoped, so a
two-model cascade forfeits cache reuse between them. That forfeited cache can quietly
eat the 60% you went to the trouble of saving.

Measure `claude-opus-5` at `medium` against your task before you split the work across
two models.

### 5. Delegate the reading, keep the judgement

When a task genuinely requires wading through bulk material — long transcripts, a
directory of logs, a survey of twenty pages — that reading does not need the strongest
model. Push it to a subagent on Sonnet 5 or Haiku 4.5 and keep the orchestrating session
for the decisions.

The real saving is **not** the per-token rate. It is that the bulk material never enters
the orchestrator's context at all, so it is not re-sent on every subsequent turn. A
100k-token transcript read by a subagent that returns a 2k summary saves far more than
60% of 100k — it saves 100k × every remaining turn.

What to delegate: reading, searching, extracting, summarising, mechanical
transformation, first-pass research.

What not to delegate: anything where being wrong is expensive and hard to detect,
anything needing the conversation's accumulated context, and the final judgement call.

Two cautions. A subagent starts cold, so a task that needs a lot of context to explain
may cost more to hand off than to do. And **choosing to spend less for a possibly weaker
answer is the human's call, not the assistant's** — offer the tradeoff, do not silently
take it.

### 6. One task per conversation

Mixing tasks in one thread means every later turn re-sends the earlier task's context.
Two unrelated jobs in one chat cost more than the same two jobs in two chats, and the
model's attention is worse for it.

Start a new session when the subject changes. Within a long single task, summarise and
restart when the conversation starts referring to its own history more than to the work
— when you find yourself scrolling back to remember a decision, so is the model.

*(If you have seen a "refresh when the task exceeds 400–500 tokens" rule: that number is
garbled somewhere in transmission. 400 tokens is two paragraphs — no useful task fits
under it. Use the behavioural signal above rather than a token count.)*

### 7. Delete prompt boilerplate written for older models

"Think step by step", "double-check your work", "take a deep breath", "you are an expert
X" — these were real techniques for models that needed the nudge. Current models reason
by default, and the instructions now cost tokens on every request while sometimes making
output worse: a don't-reason instruction paired with disabled thinking makes internal
tags leak into responses more often, not less.

Cut them. If a prompt is long because it accumulated this kind of sediment, the
`claude-api` skill's `prompt-audit` subcommand finds it systematically.

## Plan before you prompt

Iterative prompting is expensive because every correction re-sends the whole
conversation. A task specified properly the first time is usually cheaper than the same
task discovered over six turns — and this matters more on long-horizon work, which runs
better when it gets the full spec up front.

Before a substantial task, settle four things:

- **Task** — what changes, concretely.
- **Intent** — why, so the model can resolve ambiguity the way you would.
- **Guardrails** — what must not change; what it should ask about rather than assume.
- **Done** — how both of you will know, ideally something runnable.

This is worth the minute it takes on a multi-step task and is overhead on a one-liner.

## What this does not mean

Do not let cost discipline turn into hedging. Under-specifying to save input tokens, or
dropping to a weaker model on work where being wrong is expensive, produces rework that
costs more than it saved. The levers above are ordered so that the free ones come first
precisely so the ones that trade quality are reached last, and deliberately.
