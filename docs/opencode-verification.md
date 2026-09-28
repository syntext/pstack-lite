# OpenCode port verification

Verified on 2026-09-28. Canonical sources remain at repository root; installation links to those sources.

## Automated checks

- `node --test scripts/configuration.test.mjs`: 7 passing tests. Covers role precedence, nested/worktree/non-Git lookup, panel order, inheritance aliases, variants, idempotent updates, invalid-file preservation, installation reruns, linked CLI execution, and conflict detection before writes.
- Retained scripts: 38 `watch-pr` tests pass and `bun run typecheck` passes. Dependencies install with `bun install --frozen-lockfile` (Bun 1.4.2, invoked through `npx` in the verification environment).
- Shell syntax checks pass for the worktree audit and decision logger. Markdown links resolve, apart from the intentional `url` placeholder in a reviewer template. `git diff --check` passes.
- All 23 principle bodies exactly match baseline `8503161`; only activation frontmatter changed. Interrogate reference prompts and rubrics exactly match the baseline. Retained-file changes were audited against the agreed removals, OpenCode compatibility, and model configuration boundary.

## Live OpenCode checks

- Discovery returns all 44 port skills and both unpinned subagents from this checkout and a fresh installed target, including nested directories. Returned paths resolve to this port rather than an identically named global upstream installation. The 43 explicit-only skills report `autoinvoke: false`; setup remains discoverable.
- Installation in a fresh target creates 46 links; rerunning creates zero. Checkout-wide discovery links are also accepted on rerun. Supporting references and executable watcher scripts resolve through the installed links.
- Single-task smoke session `ses_f17bad983ffesrsdNAt4EiXFAG` loaded poteto-mode, reproduced an empty-array failure, made the one-line fix in the supplied file, and passed both tests. Its brief explicitly requested direct execution and excluded Git delivery steps. No separate design package or autonomous program was created.
- Interrogate smoke session `ses_f17b9cf57ffesS5nJ43xyTIVPa` resolved bundled roles, checked live model availability, launched Astra, Sol, and Luna reviewers, and synthesized their matching correctness findings without editing the sample. The first attempt interpreted “do not run code” as prohibiting the resolver and guessed a home path; it was blocked by permissions. After clarifying that the read-only resolver was allowed, the workflow passed. The shared contract now explicitly says to use the resolver rather than guess configuration paths.
- Exporting the single-task session through `opencode session export` returned the expected session information and messages.

## Coverage limits

Interactive setup choices were inspected; repeatability and preservation were tested through its helper rather than a simulated human interview. Live child launches verified the three model IDs without pinned reasoning. Variant propagation, parent inheritance, nesting-limit handoff, a fresh-session pause/resume cycle, and every retained workflow were not individually exercised end to end. Their runtime contracts are documented; no deeper nesting or persistent scheduler is assumed.

No live PR merge or app-specific verification was part of these checks.
