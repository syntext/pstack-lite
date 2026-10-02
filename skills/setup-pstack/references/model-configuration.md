# Model configuration

Read this contract before delegating. Resolve roles from the **target project's working directory**, not the installed skill directory:

```sh
node <setup-pstack-base>/scripts/models.mjs read --directory <target-directory>
```

`<setup-pstack-base>` is the absolute base directory of the setup skill supplied by the loaded plugin. From another skill it is `../setup-pstack`; from a poteto-mode playbook it is `../../setup-pstack`. Resolve pointers before passing them to children. Use the helper instead of guessing the user's home or configuration paths.

## Sources and precedence

Installation and configuration are independent. A globally enabled plugin supplies skills and agents that read the target project's preferences through this resolver. Project model setup creates only `.opencode/pstack-models.json`. Enabling the plugin in a project's `plugins` array is a separate choice; neither installation scope creates skill or agent links. A project using personal or bundled defaults needs no pstack configuration file.

1. Bundled `default-models.json` supplies recommendations.
2. `${XDG_CONFIG_HOME:-~/.config}/opencode/pstack-models.json` overrides individual roles for the user.
3. `<project-root>/.opencode/pstack-models.json` overrides individual roles for the project. Lists replace whole lists.

In Git, the root is `git rev-parse --show-toplevel`, including a worktree's own root. No lookup crosses that root. Without Git, use the closest ancestor containing `.opencode`; otherwise use the supplied directory. Setup and consumers use the same resolver. Missing files mean no overrides. Malformed files, unknown roles, and unsupported versions produce an error; fix them explicitly rather than falling back or overwriting them.

Each file is JSON with `"version": 1` and a `"roles"` object. Partial role maps are allowed. Example:

```json
{
  "version": 1,
  "roles": {
    "feature, refactoring": "openai/gpt-6-luna-fast#xhigh",
    "hardest tasks": "openai/gpt-6.1-sol#max",
    "how explorer": "openai/gpt-6-luna-fast#xhigh",
    "arena runners": ["openai/gpt-6.1-sol#max", "openai/gpt-6-astra#max", "openai/gpt-6-luna-fast#xhigh"]
  }
}
```

The full role inventory and defaults live in `default-models.json`. They recommend Luna 6 Fast with `xhigh` reasoning for routine implementation and exploration, and Sol 6.1 with `max` reasoning for the hardest work, judgment, synthesis, and reflection tooling. Astra 6 with `max` reasoning joins Sol and Luna in multi-model panels and the Arena cross-judge pool. Every role and panel entry can instead use any model available in the target project, including custom and local models. Reflect keeps its upstream shared judgment/divergent/synthesizer role. Neither default models nor this file configure credentials.

## Selection

- Real selections use `provider/model`, optionally followed by an available `#variant`. Copy the exact reference from OpenCode's available models in the target project, preserving case, additional model-name slashes, and custom aliases. Bundled defaults pin reasoning variants; overrides may select a model's default by omitting `#variant`. Use OpenCode's current discovery tools or model selector to confirm availability during setup and before dispatch. Variants belong to the selected model; do not invent them or infer reasoning by editing model-name suffixes. See [OpenCode's model guide](https://opencode.ai/v2/docs/models).
- The helper checks file structure and that selections are strings only. It preserves model selections verbatim, without reference patterns or provider, model, or variant allowlists. OpenCode's live catalog is the authority on usable models and variants during setup and before dispatch. Reading saved preferences needs no connected provider or live catalog; a temporarily unavailable choice remains saved until the user changes it.
- `inherit-parent` and the compatibility alias `auto` mean the actual parent session model. These are role-file aliases, never values for the tool's `model` argument. Omit that argument only when the selected agent has no configured model. Bundled agents are unpinned. If user configuration pins an agent, pass the known parent reference including its reasoning variant explicitly or resolve the conflict with the user; do not claim inheritance while running the pinned model.
- Panel roles are ordered nonempty lists. One child runs per entry, including repeated models and inheritance entries. Report repetitions rather than claiming model diversity. The `arena cross-judge pool` is a pool from which one judge is selected, preferring a different model ID from the parent. Model identity excludes the `#variant` suffix. No different-provider requirement applies.
- If a selected model or variant is unavailable, report it and ask for an available selection or parent inheritance before continuing the delegated stage. After the user chooses, translate that selection into the tool arguments above and resume the stage. Do not bypass the choice by doing the delegated work inline, silently switch families, invent a replacement, or edit defaults in a separate PR.
- An explicit task-specific model choice overrides the role for that task and follows the same availability checks. Otherwise use the resolved role, including user overrides. The bundled recommendations never narrow the available choices.

## Tool calls

Use OpenCode's `subagent` tool with `agent`, `description`, `prompt`, optional `model`, and `background`. Pass a complete `provider/model#variant` in `model` when a variant was selected. Use the actual advertised tool schema. Continue a child with `sessionID`. Background completion arrives as a notification; do not poll by resuming it. If the next step depends on a pending child and no independent work remains, end the turn and wait for its notification. Calling `subagent` without `sessionID` creates another child, not a wait.

When a workflow asks for a todo list, use an available task-list tool or a Markdown checklist; do not invent a tool that is not in the current catalog.

OpenCode does not provide Cursor's `readonly`, `environment`, or `cloud_base_branch` call flags. Agent permissions govern access. Worker checkouts are not isolated automatically; create any needed worktree and pass its absolute directory in the brief.

At a nesting limit, a leaf does the assigned work directly and returns evidence. It does not spawn another copy of the router or wait for an impossible child. The parent can launch the next reviewer or synthesis stage. Preserve each stage's brief and review responsibilities.
