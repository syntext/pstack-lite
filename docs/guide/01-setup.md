# Set up pstack

Install the skills and agents, choose models and reasoning at runtime, then run your first task.

## Install

From the pstack checkout, run `npm ci`, then add its absolute path to the `plugins` array in your OpenCode configuration. Use `~/.config/opencode/opencode.jsonc` for global installation or `<repo>/.opencode/opencode.jsonc` for a project installation, respecting an existing `.json` configuration and any XDG override. The native plugin registers all skills and both agents without creating discovery links. Keep the checkout in place and reload OpenCode. See [installation instructions](../../README.md#install).

## Pick your models

Run:

```text
/setup-pstack
```

[`/setup-pstack`](../../skills/setup-pstack/SKILL.md) asks for project or personal scope, detects available models and reasoning variants, shows each role (code delegates, judgment, the review panels), and asks what you want. It writes `.opencode/pstack-models.json` at the target project root or `${XDG_CONFIG_HOME:-~/.config}/opencode/pstack-models.json` for personal defaults.

This scope chooses where preferences are saved, not where the plugin is enabled. With pstack enabled globally, project setup writes only `.opencode/pstack-models.json`. It adds no local skill or agent links. If a required skill or agent is unavailable, setup reports it and checks plugin installation separately. Existing project files are left in place.

You only override what you care about. Project roles override personal roles, which override bundled defaults. Delete an override to restore the lower-priority selection. Rerunning setup preserves prior choices unless you change them. Astra handles the hardest work and judgment, Sol routine implementation, and Luna exploration and small tasks by recommendation; you can override each role. Defaults leave reasoning unpinned. A variant uses `#`, such as `openai/gpt-6-sol#high`.

Set a role to `inherit-parent` or `auto` to use the parent session model. Both mean the same thing and neither is a model ID. Bundled agents are unpinned; if user configuration pins an agent, the workflow must pass the known parent model explicitly or resolve that conflict. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Accept the verification offer, or don't

At the end of setup, `/setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.opencode/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and finish](./06-verify-and-finish.md#create-a-project-verification-skill) covers when it earns its place.

Start a new chat after installing skills or agents. Model-role files are read before delegation, so later preference updates do not depend on a new chat.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/poteto-mode` is sticky. It stays on for the conversation until you opt out by saying so.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
