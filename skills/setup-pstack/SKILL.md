---
name: setup-pstack
description: Configure pstack model roles and reasoning variants for this project or personal defaults in OpenCode. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Configure model roles for the installed skills at runtime. Read `references/model-configuration.md` first. Configuration scope and installation scope are independent: globally installed skills and agents can use project-local model preferences.

## Steps

### 1. Choose scope and detect available models

Ask with the `question` tool whether to configure this project or the user's personal defaults. This selects only the model-role file to write. Resolve the target project directory before reading or writing configuration. Do not change the user's global OpenCode configuration just because this skill is installed globally.

Check the target project's available skills and agents, including `poteto-agent` and `comment-sicko`. The native plugin with ID `pstack` registers these directly; a global plugin installation satisfies availability. Missing project-local `skills/` or `agents/` directories do not mean pstack is missing. If components are unavailable, inspect the plugin's status and report which ones are missing. Preferences can still be saved, but report the missing components before claiming the workflows are ready. Enable or install the plugin only on an explicit installation request; project configuration alone never requests a project installation.

Discover the target project's models with OpenCode's model-discovery tool when available (in Code Mode, discover the `opencode` models tool). Otherwise use `opencode models` from that directory and the `/models` selector. Confirm supported reasoning variants from the live catalog; if the available interface does not expose them, ask the user for the available selections. Never write an unconfirmed model/variant. `inherit-parent` and `auto` are always valid choices.

Recommend only `openai/gpt-6-astra`, `openai/gpt-6-sol`, and `openai/gpt-6-luna`. Astra is for the hardest work and judgment; Sol for routine implementation; Luna for exploration and small, specific work.

### 2. Load current state

Run `node <setup-pstack-base>/scripts/models.mjs read --directory <target-directory>`. It returns the effective roles and exact project/personal paths. Read the selected scope's file too, if present. Preserve existing role choices. A malformed or unsupported configuration needs an explicit correction; do not replace it with defaults.

### 3. Budget, map, and confirm

**(a) Ask for reasoning.** Offer the model's default (no `#variant`) and the supported variants reported by the catalog. Let the user choose one common supported variant or per-role variants. Keep existing selections on reruns unless asked to change them. Do not impose a universal reasoning ladder across models.

**(b) Show the roles and confirm.** Start from the bundled recommendations in `references/default-models.json`, merged with existing overrides. Show every role and selection. Ask whether to accept or change specific roles. Offer the detected OpenAI trio plus `inherit-parent` and `auto`. Model IDs use `provider/model`; a selected reasoning variant uses `provider/model#variant`.

Panel lists run one child per entry, in order. The Arena cross-judge pool supplies one judge, preferring another model ID rather than another provider. Reflect retains its shared judgment/divergent/synthesizer role. Single-role and panel choices are runtime preferences, not fixed rankings imposed by the skill.

### 4. Validate

Confirm every explicit model and variant is available in the target project. Mark unavailable choices and ask for replacements. Validate the proposed JSON with the bundled helper before applying it. Project roles override personal roles; report any personal choice that an existing project override will mask.

### 5. Write model preferences

Project setup writes only `<target-project-root>/.opencode/pstack-models.json`; personal setup writes only the personal role file. Reuse the existing plugin installation. Do not create skill or agent links, copy the bundle, edit OpenCode discovery configuration, or remove existing installations as part of model setup. A separately requested installation enables this package in the global or project OpenCode `plugins` array. Follow the installation section in the package's `README.md` (`../../README.md` relative to this skill).

Write the confirmed overrides to a temporary JSON file with `version: 1` and `roles`. Include only the roles intended for this scope; do not copy project overrides into personal defaults. Then run:

```sh
node <setup-pstack-base>/scripts/models.mjs write --scope project --directory <target-directory> --input <confirmed-json>
# Use --scope global only for confirmed personal defaults.
```

The helper validates shape and merges supplied roles with the selected file. It preserves roles not included in the update and writes atomically. To restore inheritance from lower-priority configuration, remove that role from the selected file explicitly and validate it again. The helper validates reference syntax; live availability is the setup skill's responsibility.

### 6. Confirm

Read the effective roles back, show the paths and choices, and report masked overrides. Updated model-role files are read before each workflow's delegation; preference changes do not require a fresh session. Start a fresh session only if a separately requested installation added skills or agents. Rerunning setup preserves prior choices unless the user changes them.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill`. On no, move on without pushing.
