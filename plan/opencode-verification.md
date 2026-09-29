# OpenCode port verification

Status: **Completed** (2026-09-29).

Verification updated for the solo-development revision on 2026-09-29, targeting OpenCode 2.0.18. Canonical sources remain at repository root; the native plugin registers them directly from its installed package.

## Automated checks

- `npm test`: 8 passing tests. Five cover role precedence, nested/worktree/non-Git lookup, panel order, inheritance aliases, provider-independent model references and variants, idempotent updates, and invalid-file preservation. The package-helper test configures a project from a nested directory, repeats the update, verifies that only `pstack-models.json` was created locally, and confirms personal defaults and another project's effective preferences are unchanged. Three exercise the worktree audit against real local Git repositories: paths with spaces, integrated commits, tracked/untracked work even when Git is configured to hide untracked files, missing refs/checkouts, explicit base selection, and squash-merge ambiguity.
- `npm run typecheck`: checks the plugin JavaScript against the installed V2 SDK types.
- `npm run test:integration`: packs the plugin with `npm pack`, installs that tarball and its runtime dependencies into a fresh directory, then starts isolated OpenCode servers for global and project configurations. Neither test relies on this checkout's discovery links or `node_modules` for the installed plugin. The package contains 16 playbooks, supporting references, the model helper, executable worktree audit and decision logger, and the original license. Package checks exclude retired PR-monitoring/bot-triage assets and their dependency bundle while retaining optional PR creation.
- Shell syntax checks pass for the worktree audit and decision logger. Markdown links resolve, apart from the intentional `url` placeholder in a reviewer template. `git diff --check` passes.
- All 23 principle bodies exactly match baseline `8503161`; only activation frontmatter changed. Interrogate reference prompts and rubrics exactly match the baseline. Retained-file changes were audited against the agreed removals and solo-development simplification, OpenCode compatibility, and model configuration boundary.

## Native plugin checks

- The `pstack` plugin loads through global absolute-path and project config-relative `plugins` entries. Native package export resolution finds the server entry point too.
- A nested working directory discovers all 44 skills with paths inside the installed package and bodies matching the canonical sources. The 43 explicit-only skills retain `autoinvoke: false`; setup remains discoverable.
- Both subagents have the original prompts, `subagent` mode, and no bundled model pin. Comment Sicko denies shell, edits, and further delegation while allowing reads. Configured global shell restrictions also apply to the implementation agent. User agent model/variant and description overrides survive registration.
- The packaged helper writes and resolves a project's model override. With a global plugin, the project's `.opencode/` contains only `pstack-models.json`; a project plugin also has its chosen `opencode.json` entry. No discovery links are generated.
- Reload preserves skill counts and permission-rule counts. Enabling the same package globally and locally yields one plugin and one copy of each agent. Disabling `pstack` removes the registered skills and agents while preserving model preferences.

## Open model choices follow-up (2026-09-29)

- Checked model references, custom aliases, local models, project-specific availability, and model-specific variants against the current [OpenCode model guide](https://opencode.ai/v2/docs/models). Setup and delegation use OpenCode's available choices; the helper has no provider or variant allowlist.
- Both packaged installation checks discover a custom model and variant in a real OpenCode catalog, save the selection through the installed helper, and confirm OpenCode preserves it in an agent override. Disabling that model removes it from the catalog while leaving saved preferences readable. No model-generation requests were made for this follow-up.
- All 8 tests, the 3 packaged integration checks, and typecheck passed. Test files stayed inside the repository, with enclosing Git and plugin configuration isolated during the checks and restored afterward.

## Live packaged-workflow checks

The acceptance runs used isolated OpenCode **2.0.18** servers, `npm pack` installations, and temporary Git fixtures. Each target's registry was checked for all 44 skills with paths inside the installed package before explicit skill attachment through the prompt API. Assertions inspected exported parent/child messages, tool calls, actual files, Git history, and GitHub state rather than accepting the model's final report as proof.

Per the test-budget request, these runs used `openai/gpt-6-luna`, `opencode/mimo-v2.6-flash-free`, and `opencode/longcat-2.5-preview-free`. Fixture configuration disabled Astra and Sol; an observer plugin restricted the clean runs to the three test models and recorded model references and HTTP/WebSocket reasoning settings without credentials or full request bodies. Task-specific panel overrides left the bundled Astra/Sol/Luna defaults intact.

| Check | Observed result | Root session evidence |
| --- | --- | --- |
| Configured implementation role and local-default finish | MiMo parent delegated the fix to `poteto-agent` on Luna `#high`. The child alone edited `sum.mjs`, ran both tests, and returned evidence. The parent then launched a separate report-only Comment Sicko review. Before the PR request, GitHub had no PR and the only remote branch was unchanged `main`. | `ses_f147f8c4effeG82YEAJ4keoBah` |
| Saved role → provider reasoning | With no task-specific model override, the parent resolved the project's `how explainer: openai/gpt-6-luna#high` preference and delegated one child on that reference. All four captured primary provider requests used `model: gpt-6-luna` and `reasoning.effort: high`. The preference file was unchanged. | `ses_f14635f44ffeslExfotQftY0vo` |
| Ordinary parent inheritance | An unpinned `explore` child received Luna `#medium` with the delegation's `model` argument omitted. Every assistant turn used that reference. | `ses_f147f8c4fffe1jAdlyUaH5jczS` |
| Inheritance with a pinned agent | The registry pinned `explore` to MiMo. The parent explicitly passed its Luna `#medium` reference, and the child's assistant messages confirmed that selection. | `ses_f147f8c4effdcN30yoc4h20zCc` |
| Unavailable model recovery | The configured Luna explainer was disabled. The parent asked a recovery question before any child existed; after the test answered with parent inheritance, one MiMo child completed the explanation. Saved preferences retained the unavailable choice. | `ses_f147d1903ffeTWOKu82NBYeZdX` |
| Unavailable variant recovery | `#pstack-unavailable` was rejected without creating a child. The parent requested a supported choice; after an explicit parent-inheritance answer, one Luna `#low` child ran. The role file was unchanged. | `ses_f1474d797ffe353rNK78JG49rN` |
| Nesting limit and reasoning transport | A deliberate one-call capability probe in `poteto-agent` received `Subagent depth limit reached (1)`. No grandchild was created. The leaf then read the file directly and returned evidence; the parent launched Comment Sicko afterward. Captured provider frames contained `reasoning.effort: high` for the Luna `#high` child. | `ses_f147273f3ffe35ifP8FkDgd1Ge` |
| Arena panel, judge, and synthesis | Exactly three runners used the ordered LongCat / Luna `#low` / MiMo panel and wrote separate candidate/rationale paths. One MiMo judge started only after all three completed and read every candidate and rationale. It was selected over Luna `#high`, which shares the Luna `#medium` parent's model ID. The parent produced the synthesis note and implementation; all four unchanged acceptance tests passed. Provider frames confirmed the runner's `low` reasoning effort. | `ses_f1472740cffeXM82eCFxt5JAqz` |
| Durable pause and fresh-session resume | Pause committed the existing sum fix as `34a37c1` (`wip: fix empty sum result`), left a clean tree, and saved a note without implementing the pending helper. A new root session, with no parent or fork, read that note and implemented `mean`. Four tests and independent sum/mean assertions passed; the checkpoint remained in history. | Pause `ses_f147f8c93ffev0aLrNug45r2L4`; resume `ses_f147eed70ffeQ7jUvQcFeV4XXX` |
| Explicit PR creation and reuse | A follow-up request created draft PR [syntext/pstack-e2e-20260929-f18d471#1](https://github.com/syntext/pstack-e2e-20260929-f18d471/pull/1), `fix/sum-empty-array` → `main`, containing only the one-line `sum.mjs` fix. A repeated request returned the same PR. The approved test PR was then closed without merging and the private repository archived. | `ses_f147f8c4effeG82YEAJ4keoBah` |

### Findings and reruns

- **Discovery conflict:** the first attempt loaded a globally discovered upstream pstack copy even though this plugin was active. Those runs were excluded from package acceptance. The clean harness isolated configuration and checked each skill path before dispatch. The README now documents removal of old pstack discovery sources when migrating; existing user installations were not modified.
- **Recovery alias:** an initial invalid-variant recovery passed `inherit-parent` literally as a tool model and then answered inline. The shared contract now explicitly translates inheritance aliases into omission or a full parent reference, and requires resuming the delegated stage after the choice. The corrected packaged run produced the expected child.
- **Background completion:** the first clean Arena run started its judge before every runner completed and created duplicate children while waiting. Its final artifact passed tests, but the orchestration check failed. The shared tool guidance and Arena now explicitly require completion notifications and explain that a new subagent call is not a wait. The corrected packaged run passed the runner/judge timing, exact child count, output ownership, and synthesis checks.
- Harness startup authentication, location selection, form field types, and the CLI wait timeout needed correction. Reasoning capture needed the WebSocket hook because HTTP hooks do not observe OpenAI's WebSocket transport. The Arena assertion also needed to associate launch calls with their returned session IDs and candidate paths, rather than infer panel order from concurrent session-creation timestamps. These were test-harness changes, not plugin runtime changes.

The final audit covers 10 root sessions and 13 children, with no unexpected grandchildren. All 100 runtime/package source files and their executable bits match the latest tested package. Raw exports, fixture repositories, dispatch observations, and assertion receipts are retained locally under `/tmp/opencode/pstack-e2e-f18d471/`, with the consolidated result in `completion-audit.json` and source hashes in `final-source-audit.json`. Connection files contain local server credentials and are not committed. These temporary artifacts are diagnostic evidence, not a portable automated regression suite.

## Earlier workflow smoke checks

These checks preceded native packaging and the budget-model restriction; the retained workflow bodies and model-role resolution still apply.

- Single-task smoke session `ses_f17bad983ffesrsdNAt4EiXFAG` loaded poteto-mode, reproduced an empty-array failure, made the one-line fix in the supplied file, and passed both tests. Its brief explicitly requested direct execution and excluded Git delivery steps. No separate design package or autonomous program was created.
- Interrogate smoke session `ses_f17b9cf57ffesS5nJ43xyTIVPa` resolved bundled roles, checked live model availability, launched Astra, Sol, and Luna reviewers, and synthesized their matching correctness findings without editing the sample. The first attempt interpreted “do not run code” as prohibiting the resolver and guessed a home path; it was blocked by permissions. After clarifying that the read-only resolver was allowed, the workflow passed. The shared contract now explicitly says to use the resolver rather than guess configuration paths.
- Exporting the single-task session through `opencode session export` returned the expected session information and messages.

## Coverage limits

Interactive setup choices were inspected; repeatability and preservation were tested through its helper rather than a simulated human interview. The requested budget-model run does not re-exercise the bundled Astra/Sol/Luna Arena panel or Interrogate trio; the earlier Interrogate smoke check covers those model IDs without pinned reasoning. The live cases above cover representative workflows, not every retained playbook or app-specific verification surface. They demonstrate observed behavior on these tasks, not guaranteed model compliance on arbitrary prompts.

PR creation and reuse were exercised only against the approved private fixture repository. No merge, automated landing, or publication of this plugin was performed.
