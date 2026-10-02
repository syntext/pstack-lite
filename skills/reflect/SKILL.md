---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
metadata:
  opencode/autoinvoke: false
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

Read the session-history conventions in `../poteto-mode/references/opencode.md`. The parent exports the current session by its known ID before fanning out. Verify the export's session identity and opening prompt. If no transcript is available, write a labeled digest of the session and pass that instead, noting that it cannot prove which tools ran.

### 2. Spawn three reviewers in parallel

One message, three `subagent` calls, `agent: "general"`, with `model` set as below. Reviewers may use available read-only MCP operations for context lookups (tickets, chat threads, observability traces referenced in the transcript). Their briefs must prohibit file and external-record edits.

Read `../setup-pstack/references/model-configuration.md` and resolve roles for the target project. Inheritance, unavailable selections, and nesting limits follow that contract.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `openai/gpt-6.1-sol#max` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `openai/gpt-6.1-sol#max` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `openai/gpt-6.1-sol#max` | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in the `subagent` response body.

### 3. Synthesize

One `subagent` call, `agent: "general"`, with `model` from the `reflect judgment, divergent, synthesizer` role (default `openai/gpt-6.1-sol#max`). The synthesizer's quality check includes spot-verifying citations through available read tools; its brief prohibits edits. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): follow `../poteto-mode/playbooks/authoring-a-skill.md` and validate the change.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): follow the authoring playbook and check description and activation metadata against the intended trigger.
- `new skill: <kebab-name>`: follow the authoring playbook. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
