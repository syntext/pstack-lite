# OpenCode port verification

Verified on 2026-09-28 with OpenCode 2.0.18. Canonical sources remain at repository root; the native plugin registers them directly from its installed package.

## Automated checks

- `npm test`: 4 passing configuration tests. Covers role precedence, nested/worktree/non-Git lookup, panel order, inheritance aliases, variants, idempotent updates, and invalid-file preservation. The package-helper test configures a project from a nested directory, repeats the update, verifies that only `pstack-models.json` was created locally, and confirms personal defaults and another project's effective preferences are unchanged.
- `npm run typecheck`: checks the plugin JavaScript against the installed V2 SDK types.
- `npm run test:integration`: packs the plugin with `npm pack`, installs that tarball and its runtime dependencies into a fresh directory, then starts isolated OpenCode servers for global and project configurations. Neither test relies on this checkout's discovery links or `node_modules` for the installed plugin. The package contains supporting references, the model helper, executable watcher, watcher dependency manifest and lockfile, and the original license.
- Retained scripts: 38 `watch-pr` tests pass and `bun run typecheck` passes. Dependencies install with `bun install --frozen-lockfile` (Bun 1.4.2, invoked through `npx` in the verification environment).
- Shell syntax checks pass for the worktree audit and decision logger. Markdown links resolve, apart from the intentional `url` placeholder in a reviewer template. `git diff --check` passes.
- All 23 principle bodies exactly match baseline `8503161`; only activation frontmatter changed. Interrogate reference prompts and rubrics exactly match the baseline. Retained-file changes were audited against the agreed removals, OpenCode compatibility, and model configuration boundary.

## Native plugin checks

- The `pstack` plugin loads through global absolute-path and project config-relative `plugins` entries. Native package export resolution finds the server entry point too.
- A nested working directory discovers all 44 skills with paths inside the installed package and bodies matching the canonical sources. The 43 explicit-only skills retain `autoinvoke: false`; setup remains discoverable.
- Both subagents have the original prompts, `subagent` mode, and no bundled model pin. Comment Sicko denies shell, edits, and further delegation while allowing reads. Configured global shell restrictions also apply to the implementation agent. User agent model/variant and description overrides survive registration.
- The packaged helper writes and resolves a project's model override. With a global plugin, the project's `.opencode/` contains only `pstack-models.json`; a project plugin also has its chosen `opencode.json` entry. No discovery links are generated.
- Reload preserves skill counts and permission-rule counts. Enabling the same package globally and locally yields one plugin and one copy of each agent. Disabling `pstack` removes the registered skills and agents while preserving model preferences.

## Earlier workflow smoke checks

These checks preceded native packaging; the retained workflow bodies and model-role resolution still apply.

- Single-task smoke session `ses_f17bad983ffesrsdNAt4EiXFAG` loaded poteto-mode, reproduced an empty-array failure, made the one-line fix in the supplied file, and passed both tests. Its brief explicitly requested direct execution and excluded Git delivery steps. No separate design package or autonomous program was created.
- Interrogate smoke session `ses_f17b9cf57ffesS5nJ43xyTIVPa` resolved bundled roles, checked live model availability, launched Astra, Sol, and Luna reviewers, and synthesized their matching correctness findings without editing the sample. The first attempt interpreted “do not run code” as prohibiting the resolver and guessed a home path; it was blocked by permissions. After clarifying that the read-only resolver was allowed, the workflow passed. The shared contract now explicitly says to use the resolver rather than guess configuration paths.
- Exporting the single-task session through `opencode session export` returned the expected session information and messages.

## Coverage limits

Interactive setup choices were inspected; repeatability and preservation were tested through its helper rather than a simulated human interview. Live child launches in the earlier smoke checks verified the three model IDs without pinned reasoning. Native integration checks verify configured agent variants in the registry, not model execution. Parent inheritance, nesting-limit handoff, a fresh-session pause/resume cycle, and every retained workflow were not individually exercised end to end. Their runtime contracts are documented; no deeper nesting or persistent scheduler is assumed.

No live PR merge or app-specific verification was part of these checks.
