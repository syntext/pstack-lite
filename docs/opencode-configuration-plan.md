# OpenCode configuration: preparation for step 3

Status: proposal, not active configuration. The upstream baseline, attribution update, and excluded-component cleanup are committed. Skills and agents still contain Cursor-specific instructions.

## Goal

Expose the retained skills and two agents in OpenCode V2, and establish one model-role contract that setup and every delegation workflow can share. Preserve useful upstream text and keep attribution in the README and license.

## Verified OpenCode V2 behavior

Checked against the official documentation on 2026-09-28:

- `opencode.jsonc` supports `skills` as an array of source directories and `agents` as a map of agent definitions.
- Explicit relative skill paths resolve from the active working directory, **not the configuration file**. A `skills: ["./skills"]` entry works from this checkout's root, but is not a general installation solution for nested directories or other projects.
- Skill IDs derive from directory names. Keep the existing `skills/<id>/SKILL.md` layout and supporting files together.
- Agent Markdown files are discovered under `.opencode/agents/` or `~/.config/opencode/agents/`. The existing root `agents/` directory is source material, not an automatically discovered location.
- Native agent fields include `description`, `mode`, `model`, `system`, and `permissions`. Use `mode: subagent` for these two agents; Cursor's `is_background` is not a native field.
- Agent models accept `provider/model#variant`. Model and variant availability are project-specific and must come from the live catalog. Root `model` defaults currently do not retain variants.
- A subagent without an explicit model uses its configured agent model first, then the parent session's model. Omitting a tool argument alone does not guarantee parent inheritance.
- Built-in `general` cannot launch more subagents. Workflows with nested delegation need a configured custom agent.
- The config `instructions` field is currently accepted but not loaded. Do not use it as an assumed replacement for an always-applied Cursor rule.

Sources: [configuration](https://opencode.ai/v2/docs/config), [skills](https://opencode.ai/v2/docs/skills), [agents](https://opencode.ai/v2/docs/agents), [models](https://opencode.ai/v2/docs/models).

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

## Role inventory to preserve

These are the current setup skill's role labels. Any new machine-readable names need an explicit mapping and coordinated consumer updates.

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
| `reflect judgment, divergent, synthesizer` | One selection shared by three roles | `reflect` |
| `arena runners` | Ordered list; one attempt per entry | `arena` |
| `arena cross-judge pool` | List; choose one judge | `arena` |
| `swarm workers` | Single default; races may specify each arm | `swarm` |
| `architect runners` | Ordered list; one runner per entry | `architect` |
| `interrogate reviewers` | Ordered list; one reviewer per entry | `interrogate` |

## Decisions to settle before implementation

1. **Installation scope and mechanism.** Start with this checkout, then define project-local and personal installation. Choose installed copies or links for agents and a skill source that works from nested directories. Verify behavior in a fresh target project.
2. **Role-file contract.** Finalize the proposed locations, version field, role keys, selection representation, and per-role override rules. Keep this separate from undocumented custom keys in `opencode.jsonc`.
3. **Inheritance and defaults.** Prefer one explicit `inherit-parent` value over two synonymous values. Define missing-role behavior, default panel sizes, and how to report repeated-model panels. Do not silently claim model diversity when all seats inherit one model.
4. **Reasoning budgets.** Select only variants advertised for each chosen model. Budget labels may be a setup convenience, but cannot assume every provider has an ordered `low/high/max` ladder or rewrite model-name suffixes.
5. **Agent permissions.** Make `poteto-agent` capable of the nested delegation its workflows need. Make Comment Sicko report-only, accounting for shell and delegated edits as well as direct file edits. Its upstream text currently mixes “report only” with “touch comments”; resolve that ambiguity.
6. **Catalog access.** Select and verify a model-discovery tool or API available in ordinary OpenCode installations. Avoid a dependency on this session's OpenChamber integration. Define a user-supplied catalog fallback when discovery is unavailable.

## Implementation sequence

1. Finalize the role contract and document a minimal valid example with no guessed model IDs.
2. Add checkout-local discovery and adapt/install the two agents. Preserve root source paths where practical for upstream merges.
3. Rewrite `setup-pstack` to discover models and variants, ask for scope and choices, validate selections, and update only pstack-owned data while preserving unrelated user settings.
4. Adapt `poteto-mode`, `how`, `why`, `arena`, `architect`, `swarm`, `interrogate`, and `reflect` together to consume the shared contract. Audit other delegation sites, including `no-comments`, for consistent agent and model selection.
5. Update the README's removed/replaced/added record and setup guide as each capability becomes real.

## Acceptance checks

- A fresh session loads the expected skills and both agents from this checkout and from a target project, including a nested working directory.
- Discovery resolves this port's files rather than an identically named globally installed upstream skill.
- Setup can run twice without discarding prior choices or unrelated configuration.
- A single-role choice and a supported reasoning variant reach the launched child session.
- `inherit-parent` really uses the parent model; an unavailable model or variant produces an explicit recovery choice rather than a guessed replacement.
- Project overrides and personal defaults resolve as documented; panel order and count survive round trips.
- Comment Sicko reports findings without edits. A representative nested workflow works through `poteto-agent`.
- No retained model consumer relies on `pstack-models.mdc` after the coordinated port.
