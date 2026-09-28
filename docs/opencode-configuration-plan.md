# pstack-lite for OpenCode: scope and implementation plan

Status: implementation in progress. The scope and minimal-change boundary below govern the port.

## Goal

Build a lighter pstack focused on implementation, investigation, verification, and review. Expose the retained skills and two agents in OpenCode V2, and establish one model-role contract that setup and every retained delegation workflow can share.

“pstack-lite” describes the agreed direction; renaming the repository or skill IDs is not part of this change.

## Agreed boundaries

- **Minimal adaptation of retained skills.** Preserve their original wording, steps, principles, review criteria, and behavior except where an agreed removal, OpenCode incompatibility, or selected model configuration requires a change. Every changed passage must have one of those reasons. Review findings identify risks; they do not authorize broader redesign.
- Accept requirements, constraints, file references, and acceptance criteria through runtime arguments or task context. No dependency on, named integration with, or required artifact format from an external spec/planning tool.
- Work against the supplied brief. Surface material gaps rather than generating a competing specification or deep execution plan.
- Retain bounded parallel implementation and review. Remove long-running coordinator trees, autonomous multi-PR programs, and Cursor-specific cloud/wakeup machinery.
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

## Agreed removals: next cleanup

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

Remove their router entries, model roles, examples, links, and documentation references in the same cleanup. Remove the `architect runners` setup role. Update the scripts package's test command to remove `orch`; preserve dependencies and bootstrap code still used by `watch-pr`.

Rewrite `docs/guide/07-overnight.md` only if useful retained behavior warrants a page; otherwise delete it and repair guide navigation. Update `docs/guide/04-design.md` around optional implementation comparison and review rather than the removed design lifecycle. Adjust README catalogs and counts to match the retained files.

## Retain with narrower behavior

| Component | Intended behavior |
| --- | --- |
| `poteto-mode` | Route a supplied brief to bounded engineering workflows; remove mandatory `architect` detours and deep-planning routes. |
| `arena` | Optional competing implementation attempts. Remove mandatory design exploration. |
| `swarm` | Bounded parallel tasks through OpenCode agents; no implicit cloud VM or isolated checkout per worker. |
| `interrogate` | Multi-model review of changes or supplied requirements/design artifacts, using runtime context rather than a specific spec format. |
| Feature, bug-fix, refactoring, performance, hillclimb, prototype, and investigation playbooks | Implement or investigate against the supplied brief with evidence appropriate to the task. |
| PR checking, shipping, and opening a PR | Explicit task-scoped workflows; remove cloud-worker, autonomous-program, and `/loop` assumptions. Retain useful GitHub tooling. |
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

The review's broader proposals for new execution/retry budgets, Git/PR/worktree policy changes, splitting Reflect roles, or additional utility removals are outside this port unless separately agreed. Existing runtime controls may be reused where a compatibility change requires them. “Bounded” here distinguishes task-scoped delegation from the removed standing orchestration programs; it does not mandate a new timeout framework for every skill.

### Capability migration inventory

| Imported dependency | Consumers to audit | Replacement or unavailable-capability behavior |
| --- | --- | --- |
| `deslop`, `control-ui`, `control-cli` | Router, verification skills, implementation and PR playbooks | Use available editing/review and app-driving tools. Report evidence gaps when a surface cannot be exercised; do not require a companion plugin or claim unperformed verification. |
| Cursor `create-skill` | Authoring playbook, `automate-me`, `reflect` | Native skill files and documented frontmatter, with available validation. |
| Cursor transcripts and agent store | `recall`, `reflect`, `automate-me`, `show-me-your-work`, Eval, pause/resume | Verify supported session access; accept supplied context/digests when history is unavailable and disclose their limits. |
| Cursor delegation flags | Router, workers, reviewers, judges, Eval | Actual OpenCode tool schema, model IDs/variants, supported permissions, and verified delegation depth. Include Eval's different-family judge rule in the model audit. |
| Bun and adjacent dependency installation | `watch-pr`, `bootstrap.ts`, package manifest/lockfile | Document runtime requirements and verify installed supporting files, executable bits, and dependency installation in a fresh target. |

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

Use one entry for each of the three models in default Arena and Interrogate panels. Preserve Reflect's existing shared-role structure. Per the user's ranking, recommend Astra for the hardest work, judgment and synthesis; Sol for routine implementation; Luna for exploration and small, specific tasks. Setup offers these recommendations and lets users choose role assignments, reasoning variants, and installation scope at runtime. Defaults do not pin reasoning variants. Keep explicit parent inheritance available as described below. Fast model variants with separate `-fast` IDs are outside the selected set.

Adapt reviewer diversity and judge selection to prefer a different **model ID**, rather than requiring a different provider or model family. All three chosen models share the OpenAI provider and GPT-6 family. Update upstream family-prefix fallback rules accordingly; an unavailable selection must lead to an explicit recovery choice, not a silent switch to Claude, Grok, or a guessed model.

These are implementation inputs, not fixed personal preferences. Comment Sicko will report findings; the parent applies accepted edits, consistent with the agent's report-only instruction.

## Recommended configuration boundary

Use native OpenCode configuration for skill discovery and agent behavior. Use a small, explicit pstack role file for model choices, including ordered panels and judge pools. Native agents alone do not represent variable panel membership or pool selection.

Proposed files, to be implemented after the choices below are settled:

| File or location | Responsibility |
| --- | --- |
| `opencode.jsonc` | Development configuration for this checkout; initially exercised from the repository root. |
| `agents/poteto-agent.md` | Canonical OpenCode-adapted agent prompt and metadata. |
| `agents/comment-sicko.md` | Canonical OpenCode-adapted reviewer prompt and read-only permissions. |
| `.opencode/agents/` or `~/.config/opencode/agents/` in the installation target | Discovered agent definitions installed from those canonical sources. Choose the installation mechanism before creating duplicate files. |
| `.opencode/pstack-models.json` in the target project | Proposed project-specific pstack role choices. This is pstack data, not an OpenCode configuration field. |
| `~/.config/opencode/pstack-models.json` | Proposed personal defaults, respecting the configured XDG location when applicable. |
| `skills/setup-pstack/references/model-configuration.md` | Shared contract for role names, resolution, inheritance, budgets, and panel semantics. All consumers refer to it. |

Prefer project overrides over personal defaults, resolved per role. Replace a panel list as a whole rather than concatenating it. Keep provider credentials in OpenCode's provider configuration, outside pstack's role file.

Keep model selection in one place: role mappings. Leave the two reusable agent definitions unpinned so an explicit parent-inheritance choice works. Treat existing user-supplied agent model overrides as a configuration conflict to explain and resolve rather than silently ignoring them.

## Retained role inventory

These are the upstream role labels to retain after the agreed cleanup. Any new machine-readable names need an explicit mapping and coordinated consumer updates. The source setup skill still includes `architect runners`; remove that role along with the architect skill and its consumers.

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

## Decisions to settle before implementation

1. **Installation scope and mechanism.** Start with this checkout, then define project-local and personal installation. Choose installed copies or links for agents and a skill source that works from nested directories. Verify behavior in a fresh target project.
2. **Role-file contract.** Finalize the proposed locations, path resolution, version field, role keys, selection representation, per-role override rules, and invalid-file behavior. Keep this separate from undocumented custom keys in `opencode.jsonc`.
3. **Inheritance and defaults.** Prefer one explicit `inherit-parent` value over two synonymous values. Define missing-role behavior, default panel sizes, and how to report repeated-model panels. Do not silently claim model diversity when all seats inherit one model.
4. **Reasoning budgets.** Select only variants advertised for each chosen model. Budget labels may be a setup convenience, but cannot assume every provider has an ordered `low/high/max` ladder or rewrite model-name suffixes.
5. **Agent permissions and depth.** Verify supported delegation depth and adapt only incompatible call paths. Resolve the existing Comment Sicko/`no-comments` edit-ownership ambiguity before translating their permissions and caller contract. Preserve other reviewer roles and account for the fact that children do not inherit read-only restrictions.
6. **Catalog access.** Select and verify a model-discovery tool or API available in ordinary OpenCode installations. Avoid a dependency on this session's OpenChamber integration. Define a user-supplied catalog fallback when discovery is unavailable.
7. **Role assignments.** Choose single-role defaults from the agreed OpenAI trio and select reasoning budgets. Use the trio for default panels, with judge selection preferring another model ID where available.
8. **Activation compatibility.** Verify the closest supported equivalent for existing discovery and cross-turn behavior. Surface any unavoidable behavioral difference before implementing it.

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
- Review every retained-file diff against the upstream baseline: each change maps to an agreed removal, necessary OpenCode compatibility, selected model configuration, or directly corresponding documentation. Revert unrelated rewording, policy changes, and workflow redesign.
- Retained script tests and type checks pass after pruning orchestration tooling; package commands reference only retained components.
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
