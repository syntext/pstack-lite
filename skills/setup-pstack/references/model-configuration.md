# Model configuration

Read this contract before delegating. Resolve roles from the **target project's working directory**, not the installed skill directory:

```sh
node <setup-pstack-base>/scripts/models.mjs read --directory <target-directory>
```

`<setup-pstack-base>` is the absolute base directory of the installed setup skill. From another skill it is `../setup-pstack`; from a poteto-mode playbook it is `../../setup-pstack`. Resolve pointers and symlinks before passing them to children. Use the helper instead of guessing the user's home or configuration paths.

## Sources and precedence

1. Bundled `default-models.json` supplies recommendations.
2. `${XDG_CONFIG_HOME:-~/.config}/opencode/pstack-models.json` overrides individual roles for the user.
3. `<project-root>/.opencode/pstack-models.json` overrides individual roles for the project. Lists replace whole lists.

In Git, the root is `git rev-parse --show-toplevel`, including a worktree's own root. No lookup crosses that root. Without Git, use the closest ancestor containing `.opencode`; otherwise use the supplied directory. Setup and consumers use the same resolver. Missing files mean no overrides. Malformed files, unknown roles, and unsupported versions produce an error; fix them explicitly rather than falling back or overwriting them.

Each file is JSON with `"version": 1` and a `"roles"` object. Partial role maps are allowed. Example:

```json
{
  "version": 1,
  "roles": {
    "feature, refactoring": "openai/gpt-6-sol",
    "hardest tasks": "openai/gpt-6-astra",
    "how explorer": "openai/gpt-6-luna",
    "arena runners": ["openai/gpt-6-astra", "openai/gpt-6-sol", "openai/gpt-6-luna"]
  }
}
```

The full role inventory and defaults live in `default-models.json`. Recommend Astra for the hardest work and judgment, Sol for routine implementation, and Luna for exploration and small, specific work. Reflect keeps its upstream shared judgment/divergent/synthesizer role. Role values remain user choices. Neither default models nor this file configure credentials.

## Selection

- Real selections are `openai/gpt-6-astra`, `openai/gpt-6-sol`, or `openai/gpt-6-luna`, optionally followed by an available `#variant`. Defaults leave reasoning unpinned. Validate availability through the live OpenCode model catalog in the target project before dispatch. Do not invent variants or infer reasoning by editing model-name suffixes.
- `inherit-parent` and the compatibility alias `auto` mean the actual parent session model. Omit the `model` tool argument only when the selected agent has no configured model. Bundled agents are unpinned. If user configuration pins an agent, pass the known parent reference explicitly or resolve the conflict with the user; do not claim inheritance while running the pinned model.
- Panel roles are ordered nonempty lists. One child runs per entry, including repeated models and inheritance entries. Report repetitions rather than claiming model diversity. The `arena cross-judge pool` is a pool from which one judge is selected, preferring a different model ID from the parent. Model identity excludes the `#variant` suffix. No different-provider requirement applies.
- If a selected model or variant is unavailable, report it and ask for an available selection or parent inheritance. Do not silently switch families, invent a replacement, or edit defaults in a separate PR.
- An explicit task-specific model choice overrides the role for that task. For tiny scoped work, propose Luna; keep substantial code on Sol and the hardest tasks on Astra unless configured otherwise.

## Tool calls

Use OpenCode's `subagent` tool with `agent`, `description`, `prompt`, optional `model`, and `background`. Pass a complete `provider/model#variant` in `model` when a variant was selected. Use the actual advertised tool schema. Continue a child with `sessionID`. Background completion arrives as a notification; do not poll by resuming it.

When a workflow asks for a todo list, use an available task-list tool or a Markdown checklist; do not invent a tool that is not in the current catalog.

OpenCode does not provide Cursor's `readonly`, `environment`, or `cloud_base_branch` call flags. Agent permissions govern access. Worker checkouts are not isolated automatically; create any needed worktree and pass its absolute directory in the brief.

At a nesting limit, a leaf does the assigned work directly and returns evidence. It does not spawn another copy of the router or wait for an impossible child. The parent can launch the next reviewer or synthesis stage. Preserve each stage's brief and review responsibilities.
