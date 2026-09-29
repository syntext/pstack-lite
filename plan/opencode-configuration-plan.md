# pstack-lite for OpenCode: scope and implementation plan

Status: **Completed** (2026-09-29). Implemented and verified on representative end-to-end tasks. The scope and minimal-change boundary below governed the port. Packaged live checks cover configured delegation and reasoning, inheritance, unavailable-choice recovery, nesting-limit handoff, fresh-session pause/resume, Arena panel/judge selection, and local-default/requested-PR outcomes using the requested budget models. See [verification results](./opencode-verification.md) for evidence and coverage limits.

## Goal

Build a lighter pstack focused on implementation, investigation, verification, and review. Expose the retained skills and two agents in OpenCode V2, and establish one model-role contract that setup and every retained delegation workflow can share.

“pstack-lite” describes the agreed direction; renaming the repository or skill IDs is not part of this change.

## Agreed boundaries

- **Minimal adaptation of retained skills.** Preserve their original wording, steps, principles, review criteria, and behavior except where an agreed removal or workflow simplification, OpenCode incompatibility, or selected model configuration requires a change. Every changed passage must have one of those reasons. Review findings identify risks; they do not authorize broader redesign.
- Accept requirements, constraints, file references, and acceptance criteria through runtime arguments or task context. No dependency on, named integration with, or required artifact format from an external spec/planning tool.
- Work against the supplied brief. Surface material gaps rather than generating a competing specification or deep execution plan.
- Retain bounded parallel implementation and review. Remove long-running coordinator trees, autonomous multi-PR programs, and Cursor-specific cloud/wakeup machinery.
- Default to verified local changes and a report for solo development. Retain explicit, optional PR creation; remove PR monitoring, bot triage, and automated landing. Keep diff cleanup and small commits independent of PR output.
- Preserve Lauren Tan's authorship, upstream repository references, and MIT license. Keep original wording wherever it remains useful and accurate.
- Keep the README's removed/replaced/added record accurate as changes land. Distinguish implemented behavior from planned adaptation.
- Keep upstream pstack contents at the repository root and retain the relevant git history for future upstream updates.
- Base the port's model definitions and default panels on `openai/gpt-6-astra`, `openai/gpt-6-sol`, and `openai/gpt-6-luna`. Replace the retained workflows' upstream Claude, Grok, and older GPT defaults during adaptation.

## Completed foundation

| Commit | Result |
| --- | --- |
| `8503161` | Explicit baseline over the preserved pstack subtree history. |
| `12d23ae` | README attribution, scope, and implementation status. |
| `0cd5d5e` | Removed `.cursor-plugin/`, `automations/` (Benny), and `skills/make-bot-ui/`; updated documentation. |
| `67f7b18` | Initial OpenCode configuration research and role inventory in this document. |

The Grok Bot integration was removed as a separate scope decision. The agreed model set for this port is the OpenAI trio below.

## Implemented removals

Paths are relative to the repository root.

| Path | Reason |
| --- | --- |
| `skills/architect/` | Separate design-package lifecycle and competing design synthesis exceed the intended scope. |
| `skills/figure-it-out/` | Generates bespoke execution plans before implementation. |
| `skills/poteto-mode/playbooks/multi-phase-plan.md` | Heavy multi-PR planning and prescribed verification ceremony. |
| `skills/poteto-mode/scripts/check-plan.mjs` | Validator for the removed plan format. |
| `skills/poteto-mode/playbooks/orchestrate.md` | Long-running coordinator trees and Cursor cloud-worker assumptions. |
| `skills/poteto-mode/scripts/orch/` | State and bookkeeping machinery for that orchestration, including its tests. |
| `skills/poteto-mode/playbooks/autopilot-full.md` | Autonomous multi-PR execution and merging. |
| `skills/poteto-mode/playbooks/autopilot-stack.md` | Autonomous stack management. |
| `skills/poteto-mode/playbooks/autonomous-run.md` | Cursor wakeups and `/loop`-driven execution. |
| `skills/poteto-mode/playbooks/babysit.md`, `skills/poteto-mode/playbooks/shipping.md` | PR-status loops, stack management, and automated landing exceed the solo-development scope. |
| `skills/poteto-mode/references/bugbot-triage.md` | Bot-review triage is outside the requested workflow. |
| `skills/poteto-mode/scripts/watch-pr/` | PR-only polling, status policy, review-thread handling, and associated tests. |
| `skills/poteto-mode/scripts/bootstrap.ts`, `skills/poteto-mode/scripts/package.json`, `skills/poteto-mode/scripts/bun.lock` | Dependency installation and build/test metadata used only by the retired watcher. Its local dependency directory was removed too. |

Their router entries, model roles, examples, and active documentation links were removed with them. The `architect runners` setup role is gone. The retained model helper, decision logger, and local worktree audit need no Bun dependency installation.

The overnight guide was deleted and navigation repaired. `docs/guide/04-design.md` covers optional comparison and review; `docs/guide/06-verify-and-finish.md` covers local completion and requested PR output. The README catalogs 44 skills and 16 playbooks.

## Retain with narrower behavior

| Component | Intended behavior |
| --- | --- |
| `poteto-mode` | Route a supplied brief to bounded engineering workflows; remove mandatory `architect` detours and deep-planning routes. |
| `arena` | Optional competing implementation attempts. Remove mandatory design exploration. |
| `swarm` | Bounded parallel tasks through OpenCode agents; no implicit cloud VM or isolated checkout per worker. |
| `interrogate` | Multi-model review of changes or supplied requirements/design artifacts, using runtime context rather than a specific spec format. |
| Feature, bug-fix, refactoring, performance, hillclimb, prototype, and investigation playbooks | Implement or investigate against the supplied brief with evidence appropriate to the task. |
| Opening a PR | Explicitly requested output from a reviewed, verified change. Prepare commits and prose, create the PR through an available forge tool, and return its URL. |
| Worktree cleanup | Audit local refs and uncommitted work; check session activity separately. Uncertain ancestry requires review, with no forge lookup or automatic fetch. |
| Skill authoring and verification maintenance | Produce validated local changes; PR creation is an optional requested finish. |
| Pause/resume workflows | Checkpoint and reconstruct task state using supported OpenCode facilities. |
| Principles, verification, writing, and other retained skills | Preserve portable engineering guidance; adapt platform dependencies and references to removed components. |
| `setup-pstack`, model-aware skills, and both agents | Shared model selection and bounded delegation through OpenCode. |

This document is repository development documentation, not an installed planning skill or a required runtime workflow.

## Independent review: scope-filtered findings

An independent subagent reviewed this plan against the retained sources. Apply only findings necessary for the agreed scope or a working OpenCode port. Preserve upstream behavior when no such change is required.

- **Remove design detours narrowly.** Remove calls into deleted skills and mandatory design exploration where needed for the agreed optional-comparison scope. Preserve Arena's comparison method and the underlying engineering principles. Do not rewrite principle files wholesale to simplify the port.
- **Verify delegation support.** Check any retained parent → poteto-agent → child path against the runtime. Adapt call placement only where nesting limits require it; preserve worker briefs, responsibilities, and review criteria. Do not introduce an orchestration layer to recover nesting.
- **Check reviewers and callers together.** Preserve their intended responsibilities while translating tool calls and permissions. Comment Sicko and `no-comments` contain conflicting report-only/edit assumptions; flag that ambiguity for a focused decision before changing edit ownership. Remove their references to deleted architect behavior as part of cleanup.
- **Migrate activation metadata.** Translate `disable-model-invocation`, `mode`, `reminder`, and related Cursor fields only as needed for supported V2 behavior. Preserve existing activation intent and document any unsupported behavior, including sticky mode, rather than inventing a new activation policy.

The solo-development revision separately authorizes the PR/worktree simplifications described above. Broader proposals for new execution/retry budgets, splitting Reflect roles, or additional utility removals remain outside this port unless separately agreed. Existing runtime controls may be reused where a compatibility change requires them. “Bounded” here distinguishes task-scoped delegation from the removed standing orchestration programs; it does not mandate a new timeout framework for every skill.

### Capability migration inventory

| Imported dependency | Consumers to audit | Replacement or unavailable-capability behavior |
| --- | --- | --- |
| `deslop`, `control-ui`, `control-cli` | Router, verification skills, implementation and PR playbooks | Use available editing/review and app-driving tools. Report evidence gaps when a surface cannot be exercised; do not require a companion plugin or claim unperformed verification. |
| Cursor `create-skill` | Authoring playbook, `automate-me`, `reflect` | Native skill files and documented frontmatter, with available validation. |
| Cursor transcripts and agent store | `recall`, `reflect`, `automate-me`, `show-me-your-work`, Eval, pause/resume | Verify supported session access; accept supplied context/digests when history is unavailable and disclose their limits. |
| Cursor delegation flags | Router, workers, reviewers, judges, Eval | Actual OpenCode tool schema, model IDs/variants, supported permissions, and verified delegation depth. Include Eval's different-family judge rule in the model audit. |
| Hosted PR history | `why`, code archaeology, `recall`, blast-radius review | Use local code and Git history first; supplement with hosted context only when available and relevant. |

Define exact role-file lookup rules for repository roots, nested working directories, worktrees, and non-Git projects. Setup and consumers must agree on the same path, override order, and behavior for absent, malformed, or unsupported-version files. Start with a shared documented contract; add resolver code only if necessary.

## Verified OpenCode V2 behavior

Checked against the official documentation on 2026-09-28:

- `opencode.jsonc` supports `skills` as an array of source directories and `agents` as a map of agent definitions.
- Explicit relative skill paths resolve from the active working directory, **not the configuration file**. A `skills: ["./skills"]` entry works from this checkout's root, but is not a general installation solution for nested directories or other projects.
- Skill IDs derive from directory names. Keep the existing `skills/<id>/SKILL.md` layout and supporting files together.
- Agent Markdown files are discovered under `.opencode/agents/` or `~/.config/opencode/agents/`. The existing root `agents/` directory is source material, not an automatically discovered location.
- Native agent fields include `description`, `mode`, `model`, `system`, and `permissions`. Use `mode: subagent` for these two agents; Cursor's `is_background` is not a native field.
- Agent models accept `provider/model#variant`. Model and variant availability are project-specific and must come from the live catalog. Root `model` defaults currently do not retain variants.
- A subagent without an explicit model uses its configured agent model first, then the parent session's model. Omitting a tool argument alone does not guarantee parent inheritance.
- Built-in `general` cannot launch more subagents. The tools guide documents a default nesting depth of one; a custom agent's permissions alone do not establish deeper nesting support. Verify it before using nested workflows.
- The config `instructions` field is currently accepted but not loaded. Do not use it as an assumed replacement for an always-applied Cursor rule.

Sources: [configuration](https://opencode.ai/v2/docs/config), [skills](https://opencode.ai/v2/docs/skills), [agents](https://opencode.ai/v2/docs/agents), [models](https://opencode.ai/v2/docs/models), [tools](https://opencode.ai/v2/docs/tools).

## Agreed model set and reference format

The live OpenCode model catalog confirmed these exact references on 2026-09-28:

| Model | OpenCode reference | Catalog variants |
| --- | --- | --- |
| GPT-6 Astra | `openai/gpt-6-astra` | `low`, `medium`, `high`, `xhigh`, `max` |
| GPT-6 Sol | `openai/gpt-6-sol` | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| GPT-6 Luna | `openai/gpt-6-luna` | `none`, `low`, `medium`, `high`, `xhigh`, `max` |

Use the complete `provider/model` reference in model-role data and native agent configuration. A bare `gpt-6-astra` or a Cursor-style `gpt-6-astra-max` is not the reference format for this port. A selected reasoning variant is appended with `#`, for example `openai/gpt-6-astra#high`. That example illustrates syntax; no reasoning budget has been selected yet. Recheck model and variant availability in the installation target during setup.

Use one entry for each of the three models in default Arena and Interrogate panels. Preserve Reflect's existing shared-role structure. Per the user's ranking, recommend Astra for the hardest work, judgment and synthesis; Sol for routine implementation; Luna for exploration and small, specific tasks. Setup offers these recommendations and lets users choose role assignments, reasoning variants, and configuration scope at runtime. Installation is a separate explicit action. Defaults do not pin reasoning variants. Keep explicit parent inheritance available as described below. Fast model variants with separate `-fast` IDs are outside the selected set.

Adapt reviewer diversity and judge selection to prefer a different **model ID**, rather than requiring a different provider or model family. All three chosen models share the OpenAI provider and GPT-6 family. Update upstream family-prefix fallback rules accordingly; an unavailable selection must lead to an explicit recovery choice, not a silent switch to Claude, Grok, or a guessed model.

These are implementation inputs, not fixed personal preferences. Comment Sicko will report findings; the parent applies accepted edits, consistent with the agent's report-only instruction.

## Implemented configuration boundary

Load the native `pstack` plugin through OpenCode's `plugins` configuration. It registers the canonical skills and agents in memory. Use a small, explicit pstack role file for model choices, including ordered panels and judge pools. Native agents alone do not represent variable panel membership or pool selection.

Files and installation locations:

| File or location | Responsibility |
| --- | --- |
| `package.json`, `index.js`, `plugin/` | Distributable V2 plugin and registration of the canonical Markdown sources. |
| `.opencode/opencode.json` | Enables the native plugin in this checkout through a config-relative path. |
| `agents/poteto-agent.md` | Canonical OpenCode-adapted agent prompt and metadata. |
| `agents/comment-sicko.md` | Canonical OpenCode-adapted reviewer prompt and read-only permissions. |
| OpenCode's global or project `plugins` array | Enables the plugin package; no skill or agent discovery links are generated. The former link installer is retired. |
| `.opencode/pstack-models.json` in the target project | Project-specific pstack role choices. This is pstack data, not an OpenCode configuration field. |
| `~/.config/opencode/pstack-models.json` | Personal defaults, respecting the configured XDG location when applicable. |
| `skills/setup-pstack/references/model-configuration.md` | Shared contract for role names, resolution, inheritance, budgets, and panel semantics. All consumers refer to it. |
| `skills/setup-pstack/scripts/models.mjs` | Validates, resolves, and atomically updates versioned role files. |

The plugin targets `@opencode/plugin` 2.0.18. It registers skills with `skill.transform().add()` and absolute `Skill.Info.path` values inside the package, preserving activation metadata and supporting-file access. The published runtime's `agent.transform().update()` creates missing agents with native defaults; no separate agent-add API or generated agent files are needed. User agent configuration is applied by OpenCode after plugin registration.

Prefer project overrides over personal defaults, resolved per role. Replace a panel list as a whole rather than concatenating it. Keep provider credentials in OpenCode's provider configuration, outside pstack's role file.

Keep model selection in one place: role mappings. Leave the two reusable agent definitions unpinned so an explicit parent-inheritance choice works. Treat existing user-supplied agent model overrides as a configuration conflict to explain and resolve rather than silently ignoring them.

## Retained role inventory

These upstream role labels are retained. The removed `architect runners` role is rejected by the role-file validator.

| Current role label | Shape | Main consumers |
| --- | --- | --- |
| `feature, refactoring` | Single selection | `poteto-mode` feature and refactoring playbooks |
| `bug-fix` | Single selection | Bug-fix playbook |
| `perf-issue` | Single selection | Perf playbook |
| `hillclimb` | Single selection | Hillclimb playbook |
| `judgment and prose` | Single selection | Router and judgment/prose work |
| `hardest tasks` | Single selection | Router's difficulty escalation |
| `how explorer`, `how explainer` | Two independent single selections | `how` |
| `why investigators`, `why synthesizer` | Two independent single selections | `why` |
| `reflect tooling` | Single selection | `reflect` |
| `reflect judgment, divergent, synthesizer` | One selection shared by three roles, preserving upstream behavior | `reflect` |
| `arena runners` | Ordered list; one attempt per entry | `arena` |
| `arena cross-judge pool` | List; choose one judge | `arena` |
| `swarm workers` | Single default; races may specify each arm | `swarm` |
| `interrogate reviewers` | Ordered list; one reviewer per entry | `interrogate` |

## Resolved decisions

1. **Installation:** enable the native plugin globally for use across projects, or in a project's OpenCode configuration. Markdown sources stay at the package root and the plugin registers them directly. Model setup reuses the available plugin and writes only the selected project or personal role file. A local-path installation requires that checkout to stay in place; an installed package carries its own supporting files.
2. **Role files:** version 1 JSON, project over personal over bundled defaults, merged per role. Panels replace whole lists. The shared helper owns root/worktree/non-Git lookup and rejects invalid files without overwriting them.
3. **Inheritance:** retain `inherit-parent` and upstream's `auto` alias. Bundled agents have no model pin. User-pinned agents require explicit handling before claiming parent inheritance.
4. **Reasoning:** leave defaults unpinned. Setup asks for supported variants from the live catalog and preserves choices on rerun.
5. **Permissions and depth:** Comment Sicko reports; the parent edits. Leaf agents work directly at a nesting limit and return evidence so the parent can launch the next review stage.
6. **Catalog:** use OpenCode's model-discovery tool, with CLI/model-selector and user-confirmed availability fallbacks. No OpenChamber dependency.
7. **Roles:** recommend Astra for hardest work and judgment, Sol for implementation, Luna for exploration and narrow work. Setup can override every role. Default panels use the trio; Reflect retains its shared role.
8. **Activation:** explicit-only metadata is `opencode/autoinvoke: false`. Mode persistence is a conversation instruction; reload after a fresh session or lost context.
9. **Completion:** default to reviewed, verified local work. Creating a PR requires an explicit request and ends with its URL. Routine work uses the current checkout; worktrees remain available for isolation.

## Implementation sequence

1. Apply the agreed planning/orchestration cleanup, including router entries, the retired model role, package scripts, and documentation. Preserve attribution and update the README's change record.
2. Make only necessary reference and compatibility edits in retained workflows. Remove agreed design detours and replace Cursor cloud/loop assumptions while preserving the surrounding workflow. Resolve caller/agent contradictions before changing their behavior.
3. Settle the configuration decisions above. Finalize the role contract and document a minimal valid example using the verified `openai/gpt-6-astra`, `openai/gpt-6-sol`, and `openai/gpt-6-luna` references.
4. Add checkout-local discovery and adapt/install the two agents. Migrate activation metadata and verify delegation depth before relying on nested workflows. Preserve root source paths where practical for upstream merges.
5. Rewrite `setup-pstack` to discover models and variants, ask for scope and choices, validate selections, and update only pstack-owned data while preserving unrelated user settings.
6. Adapt `poteto-mode`, `how`, `why`, `arena`, `swarm`, `interrogate`, and `reflect` together to consume the shared contract. Replace upstream model defaults and examples with the agreed OpenAI references, and revise cross-family selection to compare model IDs. Audit other delegation sites, including `no-comments`, for consistent agent and model selection.
7. Adapt transcript access, skill authoring, and verification-tool dependencies. Update the README and guide as each capability becomes real, then verify representative workflows.

## Acceptance checks

- Removed planning/orchestration components have no active routes, imports, model roles, or broken links remaining. Historical removal notes may name them.
- Removed PR-monitoring and bot-triage components have no active routes or package assets. PR creation remains an explicit-only finish in all callers.
- Review every retained-file diff against the upstream baseline: each change maps to an agreed removal or workflow simplification, necessary OpenCode compatibility, selected model configuration, or directly corresponding documentation. Revert unrelated rewording, policy changes, and workflow redesign.
- Retained script tests and type checks pass after pruning orchestration and watcher tooling; package commands reference only retained components.
- Workflows accept plain runtime instructions or arbitrary supplied file references without requiring an external spec tool, fixed directory layout, or artifact schema.
- A representative implementation task follows the supplied brief without generating a competing plan, invoking `architect`, or starting an autonomous program.
- The agreed optional implementation comparison is supported without reintroducing removed design/planning workflows; retained comparison and review criteria remain intact.
- Parallel work has a bounded scope and explicit workspace ownership; it does not assume Cursor cloud infrastructure or `/loop` wakeups.
- A fresh session loads the expected skills and both agents from this checkout and from a target project, including a nested working directory.
- Discovery resolves this port's files rather than an identically named globally installed upstream skill.
- Explicit invocation and router-triggered loading preserve upstream activation intent wherever V2 supports it. Document any required differences, including cross-turn behavior.
- A cold target installation includes runnable scripts and supporting files, with documented prerequisites and no dependence on this checkout's `node_modules`. Pause/resume succeeds in a fresh session.
- Setup can run twice without discarding prior choices or unrelated configuration.
- A single-role choice and a supported reasoning variant reach the launched child session.
- Default model references use the exact `openai/gpt-6-astra`, `openai/gpt-6-sol`, and `openai/gpt-6-luna` IDs, with any selected reasoning variant expressed as `#variant`. Retained workflows have no active upstream model-slug defaults or family-prefix fallback rules.
- Default Arena and Interrogate panels launch the three distinct configured models; Reflect keeps its shared-role mapping. Cross-judging prefers a different model ID without requiring a different provider or family.
- `inherit-parent` really uses the parent model; an unavailable model or variant produces an explicit recovery choice rather than a guessed replacement.
- Project overrides and personal defaults resolve as documented; panel order and count survive round trips.
- Role-file lookup is consistent from root and nested directories and follows the declared worktree/non-Git rules. Malformed or unsupported files produce an explicit diagnostic rather than silent fallback or overwrite.
- Reviewer permissions and callers agree on edit ownership, following the focused resolution of the Comment Sicko ambiguity. Review-only roles remain read-only under OpenCode.
- Retained delegation works in the target runtime with model/variant propagation. Changes to nesting preserve the original task and review responsibilities.
- No retained model consumer relies on `pstack-models.mdc` after the coordinated port.
