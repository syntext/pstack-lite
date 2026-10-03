# pstack-lite

a native OpenCode V2 plugin adapting [pstack](https://github.com/cursor/plugins/tree/main/pstack), created by [Lauren Tan (poteto)](https://x.com/poteto) in the [cursor/plugins repository](https://github.com/cursor/plugins). this repository preserves pstack's relevant git history and [MIT license](./LICENSE).

it also includes selected skills from [Matt Pocock's skills](https://github.com/mattpocock/skills), currently [`codebase-design`](./skills/codebase-design/SKILL.md), under his [MIT license](./skills/codebase-design/LICENSE).

the scope is implementation, investigation, verification, review, local execution coordination, and model selection. the default result is verified local work and a concise report; creating a PR is an optional finish when you request it. supply requirements and file references at runtime; no spec tool or artifact format is required. deep planning, PR-monitoring programs, and bundled unattended scheduling are excluded. retained skills keep upstream wording and behavior except for these exclusions, OpenCode compatibility, and model selection.

much of this README retains Lauren's original wording. first-person descriptions of pstack's style and philosophy are hers.

## from the original author

i'm [poteto](https://x.com/poteto). i'm not a president or ceo, but i've worked with millions of lines of code at Meta, Netflix, and Cursor. i'm also on the react core team where i help build and maintain react compiler.

there's a growing sense that ai writes too much slop code. i agree. i don't want to ship like a team of twenty slop artists. throughput without quality is not a goal i aspire to. if you want to go fast, go deep first. 

**pstack is my answer.** these are the same skills i use everyday to ship high quality code at Cursor. this turns cursor into a real engineering team. the goal is not to maximize loc, in fact it's the opposite. pstack helps you write less, but higher quality code.

**pstack gives you fearless parallelism.** when you can go deep on one agent and trust it to write good, verifiable code, you can truly parallelize with confidence. start multiple agents up with `poteto-mode` and trust that they'll apply rigorous engineering principles to their work.

every frontier model has its strengths and weaknesses. many of these skills use multi-model workflows to take advantage of each model's unique strengths.

fork it. improve it. make it yours. PRs are welcome! 

## changes from upstream

### removed from the port

- **Cursor plugin packaging** (`.cursor-plugin/`): removed the manifest and Cursor installation command.
- **Benny** (`automations/benny/`): removed the optional Slack triage and reproduction automation pack, including its skills, templates, and setup instructions.
- **Grok Bot UI** (`skills/make-bot-ui/`): removed the routine/webhook integration and its skill listing. the port's bundled model defaults were chosen separately, as described below.
- **Cursor-only setup advice**: installation of `cursor-team-kit`, `/loop` recommendations, and migration advice for old Cursor model rules have been removed.
- **Deep planning and PR autopilot**: removed `architect`, `figure-it-out`, the multi-phase planning playbook and validator, both autopilot playbooks, and the overnight guide. implementation comparison through `arena` remains optional. Orchestrate and Autonomous run have been restored for supplied work and local execution, without their cloud/PR machinery.
- **PR monitoring and automated landing**: removed Babysit, Shipping, Bugbot triage, and `skills/poteto-mode/scripts/watch-pr/`, including its tests, bootstrap, and dedicated Bun dependency bundle.

the original files remain available in the preserved upstream history and baseline commit `8503161`.

### replaced for OpenCode

- Cursor `Task` calls and flags now use OpenCode `subagent` calls and agent permissions. workers share a local environment unless a checkout is prepared explicitly.
- model rules now use project/personal JSON role overrides and `provider/model#variant` references. defaults recommend Luna 6 Fast (`xhigh`) for routine implementation and exploration, Sol 6.1 (`max`) for the hardest work and judgment, and Astra 6 (`max`) only in multi-model panels and the Arena cross-judge pool.
- Cursor transcript paths now use project-scoped OpenCode session listing/export, with disclosed gaps when history is unavailable.
- companion-tool dependencies now use available tools or project harnesses. skill authoring uses native OpenCode files.
- activation metadata now uses OpenCode's explicit-only discovery control. sticky mode is a conversation instruction, not an editor hook.
- Comment Sicko reports proposed changes; the parent applies accepted findings. its review criteria remain the same.
- ordinary workflows finish locally. PR creation runs only on request, then returns the URL. worktree auditing uses local Git refs; hosted PR history is optional investigation context.
- Orchestrate decomposes supplied work into dependent execution units and coordinates local implementation, verification, and integration. its Node bookkeeping uses unit/revision/attempt records and replay-safe completion acknowledgment, not a PR frontier. Autonomous run continues one goal through the matching engineering playbook. neither bundles a scheduler or creates a competing specification.

### added for this port

- a standalone repository with pstack's contents at the root and its relevant upstream history preserved.
- explicit upstream attribution, scope, and implementation status in this README.
- a [configuration design note](./plan/opencode-configuration-plan.md) with OpenCode V2 behavior, the role inventory, and resolved implementation decisions.
- a native `pstack` plugin that registers the bundled skills and agents directly, shared role defaults/resolver, and configuration/package-loading tests.
- [`codebase-design`](./skills/codebase-design/SKILL.md) from [Matt Pocock's skills](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design): deep-module design vocabulary. its wording is kept except for explicit-only activation, OpenCode `subagent` dispatch with the parent model in design-it-twice, and an optional domain glossary. the Codex-only `agents/openai.yaml` metadata is omitted.

## install

requires OpenCode 2.0.18 or a compatible V2 release, Node.js 22 or newer, and Git. install globally from [syntext/pstack-lite](https://github.com/syntext/pstack-lite):

```sh
opencode plugin add github:syntext/pstack-lite
```

for project installation, add the GitHub repository to the `plugins` array in `<repo>/.opencode/opencode.jsonc`, preserving other entries:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:syntext/pstack-lite"]
}
```

- **Global:** `~/.config/opencode/opencode.jsonc` (or `$XDG_CONFIG_HOME/opencode/opencode.jsonc`). The plugin is available across projects.
- **Project:** `<repo>/.opencode/opencode.jsonc`. The plugin is available in that project, including nested working directories.

use the existing `.json` or `.jsonc` file if you already have one. OpenCode downloads the plugin and installs its dependencies from GitHub. Reload OpenCode after enabling it. See [OpenCode plugin installation](https://opencode.ai/v2/docs/plugins).

the plugin registers the bundled skills and agents in memory using OpenCode's native plugin API. It creates no skill or agent links and writes no discovery files. Supporting files remain inside the plugin package. Its plugin ID is `pstack`; append `"-pstack"` after its entry to disable it.

with a global plugin installation, `/setup-pstack` creates only `.opencode/pstack-models.json` when you choose project preferences. a project using personal or bundled defaults needs no pstack files. setup changes model preferences; enabling the plugin is a separate, explicit action.

**Migrating from the earlier link installer:** enable the native plugin, then remove only the old pstack-owned discovery links you previously installed. Preserve unrelated or customized files. The plugin does not delete existing installations. The former `scripts/install.mjs` installer has been retired.

an upstream pstack copy in a discovered skills directory can shadow this plugin's matching IDs in OpenCode 2.0.18. disable that old discovery source when migrating, and check that a loaded skill's base directory points inside this plugin package. an active plugin entry alone does not prove which skill body was selected.

### Package distribution

`npm pack` produces a distributable package containing the entry point, skills, agents, and supporting files. No build step is required. This repository has not been published to npm; use the GitHub installation above.

### Development checks

from a development checkout, install dependencies and run:

```sh
npm ci
npm test
npm run typecheck
npm run test:integration
```

the integration test requires `opencode`, `npm`, and Git. It packs and installs the package into a temporary directory, starts isolated OpenCode servers, and exercises global/project loading without using personal configuration or model credentials.

requested PR creation uses an authenticated forge tool, such as `gh` for GitHub. the worktree audit and decision logger use Bash; the bundled helpers need no Bun installation. app verification uses whatever browser, terminal, simulator, or project harness is available; unavailable verification is reported as a gap.

## get started

two steps:

1. run [`/setup-pstack`](./skills/setup-pstack/SKILL.md), pick a reasoning budget, and choose which models you want.
2. use [`/poteto-mode`](./skills/poteto-mode/SKILL.md) whenever you're doing anything that requires rigor.

the [pstack guide](./docs/guide/README.md) walks through setup, prompting, and verification.

the other skills are situational; the mode skill uses them for you as needed. the mode splits work by model strength across code, prose, judgment, and review panels. [`/setup-pstack`](./skills/setup-pstack/SKILL.md) lets you choose any model available in your OpenCode project, including custom and local models, and any variant that model supports. bundled defaults use `openai/gpt-6-luna-fast#xhigh`, `openai/gpt-6.1-sol#max`, and `openai/gpt-6-astra#max`. OpenCode supplies the available choices; pstack keeps no provider or variant allowlist. see the [model contract](./skills/setup-pstack/references/model-configuration.md).

## usage

use [`/poteto-mode`](./skills/poteto-mode/SKILL.md) at the start of a task. it reads your request, picks from a set of playbooks, and runs the other skills as the steps need them.

### just use [`/poteto-mode`](./skills/poteto-mode/SKILL.md)

this skill is the main shortcut. i use it whenever i need the agent to do rigorous engineering work. this port includes eighteen playbooks:

```
/poteto-mode this view has a subtle bug where the scroll drifts every 750ms even when idle. repro
first, then fix and verify.
```

<details>
<summary>the eighteen playbooks</summary>

| playbook | for |
|---|---|
| [investigation](./skills/poteto-mode/playbooks/investigation.md) | a read-only question. how does x work, why was y built this way, are we sure. |
| [bug fix](./skills/poteto-mode/playbooks/bug-fix.md) | reproduce a defect, root-cause it, and fix with runtime evidence. |
| [perf](./skills/poteto-mode/playbooks/perf-issue.md) | trace a measured slowness and improve it against a baseline. |
| [hillclimb](./skills/poteto-mode/playbooks/hillclimb.md) | sustained, scientific improvement of one metric against a target, looping hypotheses with before/after measurement and one commit per accepted win. |
| [runtime forensics](./skills/poteto-mode/playbooks/runtime-forensics.md) | diagnose a live symptom (leak, idle-cpu spin, glitch) from instrumentation. |
| [trace forensics](./skills/poteto-mode/playbooks/trace-forensics.md) | diagnose a captured profiling artifact (cpuprofile, trace, spindump, heap snapshot). |
| [feature](./skills/poteto-mode/playbooks/feature.md) | new or changed behavior, built from a named data shape. |
| [orchestrate](./skills/poteto-mode/playbooks/orchestrate.md) | coordinate supplied work across dependent owners, with durable state and verified local integration. |
| [autonomous run](./skills/poteto-mode/playbooks/autonomous-run.md) | keep driving one checkable goal through its matching engineering playbook, with checkpoints. |
| [refactoring](./skills/poteto-mode/playbooks/refactoring.md) | a behavior-preserving change to structure or shape. |
| [prototype](./skills/poteto-mode/playbooks/prototype.md) | a throwaway sketch to make a design or behavioral decision cheaply, or to settle an empirical fork by observing it. |
| [visual parity](./skills/poteto-mode/playbooks/visual-parity.md) | pixel-exact ui equivalence between two implementations. |
| [authoring a skill](./skills/poteto-mode/playbooks/authoring-a-skill.md) | writing or editing a SKILL.md. |
| [eval](./skills/poteto-mode/playbooks/eval.md) | test how a skill or prompt change affects agent behavior, blinded. |
| [session pickup](./skills/poteto-mode/playbooks/session-pickup.md) | resume or take over a prior agent's in-flight work. |
| [pause safely](./skills/poteto-mode/playbooks/pause-safely.md) | suspend in-flight work cleanly so it can be resumed later. |
| [worktree cleanup](./skills/poteto-mode/playbooks/worktree-cleanup.md) | reclaim disk by pruning merged or abandoned worktrees and stale ios simulators, safety-gated. |
| [opening a pr](./skills/poteto-mode/playbooks/opening-a-pr.md) | when explicitly requested, create a pr for the reviewed and verified change, then return its URL. |

</details>



when invoked it:

1. matches your task to a [playbook](./skills/poteto-mode/playbooks/) and opens a todo list whose first items are its steps, copied in verbatim.
2. routes to the other skills as the steps fire.
3. writes unslopped replies framed for the consumer and the maintainer.

the full rules and playbooks live in [`skills/poteto-mode/SKILL.md`](./skills/poteto-mode/SKILL.md).

[`/poteto-mode`](./skills/poteto-mode/SKILL.md) asks the agent to keep the mode active across matching follow-ups. opt out any time by saying so. OpenCode has no bundled Cursor-style mode reminder; reload the skill after a fresh session or lost context.

## skills

[`/poteto-mode`](./skills/poteto-mode/SKILL.md) runs most of these for you when a step needs them (`how`, `why`, `arena`, `swarm`, `interrogate`, `unslop`, `no-comments`, `technical-writing`, `tdd`, and the principles). the table below is for when you want one directly:

```
/how do we cancel runs? do we have an n+1 when we look up every run to cancel?
```

```
/interrogate review my local changes.
```

<details>
<summary>all skills</summary>

| skill | use it when |
|---|---|
| [`/poteto-mode`](./skills/poteto-mode/SKILL.md) | default entry point for any non-trivial task. |
| [`/how`](./skills/how/SKILL.md) | you want a walkthrough of how a subsystem works. |
| [`/why`](./skills/why/SKILL.md) | you want to know why something was built this way. discovers available MCPs at run time and queries each evidence category in parallel (source control, issue tracker, long-form docs, real-time chat, infra observability, error tracking, analytics warehouse). |
| [`/recall`](./skills/recall/SKILL.md) | you're starting or resuming work and want your recent context on a topic rebuilt from your own chat history and the shared record, handed back as a tight current-state brief. |
| [`/blast-radius`](./skills/blast-radius/SKILL.md) | you have a small-looking change and want to know what else it could break, with the one fact it's safe because of proven by running code, not asserted. |
| [`/arena`](./skills/arena/SKILL.md) | you want N parallel attempts at the same thing, then to grab the best parts of each. |
| [`/swarm`](./skills/swarm/SKILL.md) | you want N parallel workers across different slices or races, then one aggregated report. |
| [`/interrogate`](./skills/interrogate/SKILL.md) | you have a diff and want several different models to try to break it, including a strict code-quality lens. |
| [`/automate-me`](./skills/automate-me/SKILL.md) | you want your own `-mode` skill, drafted from how you've actually worked. |
| [`/setup-pstack`](./skills/setup-pstack/SKILL.md) | you want to choose project or personal model preferences and reasoning variants. detects your models and writes role overrides. |
| [`/reflect`](./skills/reflect/SKILL.md) | a long task landed and you want the recipe captured as a skill edit. |
| [`/teach`](./skills/teach/SKILL.md) | you want to actually understand a change or subsystem, not just have it summarized. runs how + why and weaves one plain explanation, built up diagram by diagram. |
| [`/tdd`](./skills/tdd/SKILL.md) | you're fixing a bug and there's a cheap local test path. write the failing test first, then the fix. |
| [`/no-comments`](./skills/no-comments/SKILL.md) | strip comments before review; spawns Comment Sicko, fixes accepted findings, offers encodings for claimed constraints. |
| [`/codebase-design`](./skills/codebase-design/SKILL.md) | you're designing or reshaping a module's interface, deciding where a seam goes, or making code more testable. shared deep-module vocabulary, from [Matt Pocock](https://github.com/mattpocock/skills). |
| [`/typescript-best-practices`](./skills/typescript-best-practices/SKILL.md) | you're reading or editing typescript. grounds the type-system-discipline principle in syntax. |
| [`/show-me-your-work`](./skills/show-me-your-work/SKILL.md) | you want a reviewable decision trail. logs decisions to a tsv you can commit. |
| [`/create-verification-skill`](./skills/create-verification-skill/SKILL.md) | your project has no scripted way to prove app behavior. generates a project-local verify skill with a feature map, for any language or platform. |
| [`/maintain-verification-skill`](./skills/maintain-verification-skill/SKILL.md) | your verify skill's feature map has drifted from the app. source wave + one live pass, with scoped local corrections. |
| [`/unslop`](./skills/unslop/SKILL.md) | you're cleaning up writing. removes AI tells. |
| [`/bro`](./skills/bro/SKILL.md) | you want the last message restated in plain human language, no jargon. |
| [`/technical-writing`](./skills/technical-writing/SKILL.md) | layered doc standard (Diátaxis + Google developer style + STE + Global English) for docs, RFCs, readmes, PR descriptions, commit messages. |

</details>



### examples

mostly i type [`/poteto-mode`](./skills/poteto-mode/SKILL.md) at the start of a task and let it route to a playbook. the other skills fire as the steps need them. a few i reach for directly.


<details>
<summary>all the examples</summary>

```
bug fix:           /poteto-mode this view has a subtle bug where the scroll drifts every 750ms even
                   when idle. repro first, then fix and verify.
perf:              /poteto-mode a big list takes a second or two to load even though we virtualize.
                   run a cpu trace and tell me why.
feature:           /poteto-mode build a small feature behind a feature flag. verify it really works.
prototype:         /poteto-mode build two prototypes of the markdown renderer so we can compare.
                   spawn an agent for each.
optional PR:       /poteto-mode open a pr for this verified change. include the evidence.
visual parity:     /poteto-mode the row spacing is too tall when this flag is on. the second image
                   is correct. repro and fix until it matches.
how:               /how do we cancel runs? do we have an n+1 when we look up every run to cancel?
why:               /why is this feature flag not on yet?
arena:             /arena take my prompt to the arena verbatim. i want to compare their proposals
                   with yours.
swarm:             /swarm check every package under packages/ against its check.sh. one worker per
                   package. one report.
interrogate:       /interrogate review my local changes.
tdd:               /tdd implement
unslop:            can we unslop and tighten the new changes?
reflect:           /reflect that took too long. capture what we learned so the next run doesn't
                   repeat it.
show-me-your-work: /show-me-your-work keep a decision trail i can review when i'm back.
automate-me:       /automate-me
```

</details>

## the `poteto-agent` and Comment Sicko subagents

pstack also ships [poteto-agent](./agents/poteto-agent.md), a subagent that runs Lauren's style end to end. it reads `poteto-mode` in full, including its inline principles index, before doing any work.

[`/poteto-mode`](./skills/poteto-mode/SKILL.md) and [poteto-agent](./agents/poteto-agent.md) route through the same wrapper.

pstack also ships [Comment Sicko](./agents/comment-sicko.md), a read-only comment reviewer. usually invoke it through [`/no-comments`](./skills/no-comments/SKILL.md), not directly. both are native OpenCode subagents with no pinned model. at a nesting limit, a leaf does its assigned work directly and the parent owns any separate review stage.

## principles

short skills, one principle each. `poteto-mode` indexes them inline and reads that index at task start. the standalone files are there so other skills can reference a principle by name, and so the index can point at the full rule for each.

<details>
<summary>all principles</summary>

| principle | group | rule |
|---|---|---|
| [laziness-protocol](./skills/principle-laziness-protocol/SKILL.md) | core | Bias toward deletion and the smallest change that solves the problem. |
| [foundational-thinking](./skills/principle-foundational-thinking/SKILL.md) | core | Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the data structures right so downstream code becomes obvious. |
| [redesign-from-first-principles](./skills/principle-redesign-from-first-principles/SKILL.md) | core | Redesign as if the requirement had been a foundational assumption from day one, instead of bolting it on. |
| [attack-the-premise](./skills/principle-attack-the-premise/SKILL.md) | core | Apply when two or more fixes that share one premise have failed the same gate. Take a census of which actors hold the imbalance before the next fix, then question the premise instead of writing another fix that assumes it. |
| [subtract-before-you-add](./skills/principle-subtract-before-you-add/SKILL.md) | core | Remove dead weight, redundant validators, and stub references first, then build on the simpler base. |
| [minimize-reader-load](./skills/principle-minimize-reader-load/SKILL.md) | core | Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope. |
| [outcome-oriented-execution](./skills/principle-outcome-oriented-execution/SKILL.md) | core | Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code. |
| [experience-first](./skills/principle-experience-first/SKILL.md) | core | Choose user delight over implementation convenience; ship fewer polished features over more rough ones. |
| [exhaust-the-design-space](./skills/principle-exhaust-the-design-space/SKILL.md) | core | Build 2-3 competing prototypes and compare side by side before committing. |
| [build-the-lever](./skills/principle-build-the-lever/SKILL.md) | core | Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun. |
| [model-the-domain](./skills/principle-model-the-domain/SKILL.md) | architecture | Encode the domain in a structure instead of scattered conditionals. |
| [boundary-discipline](./skills/principle-boundary-discipline/SKILL.md) | architecture | Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions. |
| [type-system-discipline](./skills/principle-type-system-discipline/SKILL.md) | architecture | Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, refuse to lie to the compiler, exhaust variants, derive from authoritative schemas. |
| [make-operations-idempotent](./skills/principle-make-operations-idempotent/SKILL.md) | architecture | Converge to the same end state regardless of partial prior runs. |
| [migrate-callers-then-delete-legacy-apis](./skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | architecture | Migrate callers and delete the old API in the same wave instead of preserving compatibility layers. |
| [separate-before-serializing-shared-state](./skills/principle-separate-before-serializing-shared-state/SKILL.md) | architecture | Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant. |
| [prove-it-works](./skills/principle-prove-it-works/SKILL.md) | verification | Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'. |
| [fix-root-causes](./skills/principle-fix-root-causes/SKILL.md) | verification | Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards that silence crashes. |
| [sequence-verifiable-units](./skills/principle-sequence-verifiable-units/SKILL.md) | verification | Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer. |
| [test-behavior-not-implementation](./skills/principle-test-behavior-not-implementation/SKILL.md) | verification | Apply when you write, change, or keep a test. Call the code the way its users do and assert the result they observe against a literal expected value. If the test would still pass when every imported function returns undefined, rewrite the assertion or delete the test. |
| [guard-the-context-window](./skills/principle-guard-the-context-window/SKILL.md) | delegation | Route bulk to subagents; keep summaries in the main thread, not raw payloads. |
| [never-block-on-the-human](./skills/principle-never-block-on-the-human/SKILL.md) | delegation | Proceed, present the result, let the human course-correct after the fact; reserve confirmation for irreversible actions. |
| [encode-lessons-in-structure](./skills/principle-encode-lessons-in-structure/SKILL.md) | meta | Encode the rule as a lint, metadata flag, runtime check, or script instead of more text. |

</details>

## runtime capabilities

the [runtime conventions](./skills/poteto-mode/references/opencode.md) describe tool discovery, live verification, session history, skill authoring, and optional PR output. MCP integrations are optional evidence sources. pstack does not bundle credentials, a scheduler, or an external spec/planning tool.

see [verification results](./plan/opencode-verification.md) for automated checks, live workflow evidence, and coverage limits.

## why are there no planning skills?

the best spec is code. this port accepts the brief you supply and focuses on implementation and review; deep planning workflows were removed. Orchestrate owns execution decomposition and coordination, not specification authoring. supplied planning files are read-only by default; runtime records track work and evidence rather than creating a second plan.

## make it yours

`poteto-mode` is my style. you may not want exactly that.

type [`/automate-me`](./skills/automate-me/SKILL.md). it mines your recent transcripts, drafts a `<your-name>-mode` skill from how you've actually worked, and routes through pstack underneath. you keep pstack as the base and end up with your own routing skill alongside `poteto-mode`.

models are configurable too. [`/setup-pstack`](./skills/setup-pstack/SKILL.md) maps each role (code, judgment, the review panels) to a model. project overrides live in `.opencode/pstack-models.json`; personal defaults live in `${XDG_CONFIG_HOME:-~/.config}/opencode/pstack-models.json`. rerunning setup preserves existing choices.

## license

[MIT](./LICENSE). original work copyright Lauren Tan. upstream: [cursor/plugins — pstack](https://github.com/cursor/plugins/tree/main/pstack).

[`codebase-design`](./skills/codebase-design/) is [MIT](./skills/codebase-design/LICENSE), copyright Matt Pocock. upstream: [mattpocock/skills — codebase-design](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design).
