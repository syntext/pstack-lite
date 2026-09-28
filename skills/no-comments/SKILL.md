---
name: no-comments
description: "Spawn Comment Sicko, fix accepted findings, and offer encodings for claimed constraints."
metadata:
  opencode/autoinvoke: false
---

# No comments

Spawn Comment Sicko. Act on accepted findings.

Defer to Comment Sicko's fresh perspective.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree.

## Steps

1. Read `../setup-pstack/references/model-configuration.md`. Spawn `subagent` with `agent: "comment-sicko"` and the `judgment and prose` model. Pass the scope and diff; the reviewer cannot run shell commands or edit. Do not restate its rules. At a nesting limit, return the scoped review request to the parent.
2. Inspect its proposed findings. Reject scope escapes, exception-protected deletions, misstated `MUST KILL` reasons, and flags that treat kept intentional code as guilty. Reshape flags on our-code surprises stay actionable. A keep survives only with proof it is about something we cannot change. Audit missed scoped lint and TypeScript suppressions. Correctness or safety suppressions stay actionable `MUST KILL`s. Keep comments only with exact exceptions and scoped proof. Before accepting thin `IMPORTANT` or `do not remove` kills or keeps, run `/how` or `/why` on their symbol. If a keep is refuted or still ambiguous, delete it. Rerun one rejected report with the failure named. Reject a second, report it open, and fail `/no-comments`. The parent applies accepted deletions.
3. Fix trivial accepted flags directly by deleting a dead path, dropping a parameter, or using the real API.
4. Implement the smallest root-cause fix in scope. Remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest open. The **principle-fix-root-causes** and **principle-redesign-from-first-principles** skills guide intent only. Neither authorizes widening the fence nor fixing instances outside it. Never bolt on symptom guards.
5. Constraint comments say `do not remove`, `do not change wording`, or `talk to X before changing`. Leave keeps about things we cannot change. Offer the cheapest in-scope type, runtime, test, or CI lint. Wait for interactive approval. Unattended and eval require caller pre-approval. If approved, encode then delete. Otherwise delete, report the constraint open, and sketch out-of-scope work.
6. Report the deletion count, rejected findings, reruns, fixes, encoding offers, encodings, unenforced constraints, and other open work.
