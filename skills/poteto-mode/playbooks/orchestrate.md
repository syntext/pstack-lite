### Orchestrate

**You own the program, never the code. Author briefs, drain the queue, keep the integrated result green, decide.** For a supplied program of dependent implementation units that outlives one owner. One task driven to a predicate is Autonomous run. Code-coupled work stays with one owner under Feature or the matching engineering playbook. Ceremony must scale with the program.

Three rules carry the rest.

- Completions are queue events, not interrupts.
- Every spawn and every resume carries the standing orders.
- The brief is the product. A vague brief fails quietly.

#### Ownership and placement

The supplied requirements, designs, and task lists own intent. Accept text and file references without a required format or planning-tool integration. They are read-only unless the operator explicitly requests completion-marker updates. Do not rewrite scope or acceptance criteria. Map execution units back to supplied task identifiers or requirement references. A supplied task is complete only when every unit implementing it is integrated and verified.

The coordinator authors briefs, drains completions, makes judgment calls, and owns the report. It does not implement feature code. Clean integration of verified scoped commits is bookkeeping it may do. Conflicts and code changes go back to an owner. Reuse the retained engineering playbooks, model contract, review skills, and runtime conventions. Resolve models from the task project and pass explicit selections and source pointers to workers. Do not introduce model roles or pins.

Use one root coordinator by default. A sub-coordinator earns its place only when one coordinator cannot drain the track and the runtime supports the nesting. At a nesting limit the leaf owns its assigned diff directly; the parent launches separate verification. Never create a tree that waits for unavailable delegation.

One writer per checkout or branch. Disjoint files do not isolate the Git index. Parallel code writers need prepared worktrees; otherwise serialize. Preserve pre-existing edits. If an isolated checkout cannot faithfully include required local state, serialize against the current checkout instead of discarding or committing unrelated work. Relay upstream context into downstream briefs. Workers cannot assume access to siblings' conversations.

#### Store and helper

Choose a task-local durable directory, outside the installed package, before dispatch. The default is `<project>/.opencode/pstack-runs/<run-id>/`. Use a user-supplied output path instead when given. Execution records are assignments, revisions, progress, and evidence, not a competing specification.

Run `node <poteto-mode-base>/scripts/orch/orch.mjs --store <directory> <command> --input '<JSON>'`. `--input-file <path>` accepts the same object from a file. Omit input for reads. `--help` lists commands. The helper never spawns, waits, wakes, or integrates anything.

- `state.json` atomically holds units, ledger, inbox, acknowledged pointers, gates, and standing orders. The coordinator is its only logical writer. `status.md` is derived with `status`, never hand-maintained.
- Briefs and receipts live alongside the store. Open the decision trail through **show-me-your-work**. Keep source references in each brief, not a second requirements document.
- Add units in dependency order with `unit add` and `{ "id": "u1", "track": "build", "source": "supplied task 1", "brief": "<absolute brief path>", "depends": [] }`.
- After allocating exclusive scope, start with `unit start` and `{ "id": "u1", "worker": "<owner/session id>", "branch": "<branch or checkout>" }`. Record the returned attempt in every brief and completion. Starting is allowed only after dependencies are `done`.
- Record a code-ready result with `unit result` and `{ "id": "u1", "attempt": 1, "sha": "<verified commit or explicit snapshot identifier>" }`. Never identify dirty code by HEAD alone. `unit revise` records a changed result and invalidates its verified state.
- Record verification with `ledger record` and `{ "id": "u1", "attempt": 1, "sha": "<exact revision>", "verdict": "unit-test-verified", "evidence": "<receipt path>", "verifier": "<reviewer id>" }`. Verdicts are `live-verified`, `unit-test-verified`, `type-check-only`, `verifier-blocked`, or `verifier-failed`. `ledger check` takes the id and exact sha.
- After local integration use `unit integrate` with the id, attempt, and integrated sha. Record acceptance checks at that integrated revision, then `unit done` with the id and attempt. The helper checks revision bookkeeping, not whether a receipt actually proves acceptance. Audit receipts yourself. Typecheck alone, a blocked check, or a failed check cannot complete a unit.
- `inbox push` takes `{ "unit": "u1", "attempt": 1, "status": "code-ready", "report": "<receipt path>" }`. `inbox drain` reads without deleting. Record effects before `inbox ack` with `{ "id": "<pointer id>", "disposition": "<action taken or stale result rejected>" }`. Acknowledgment archives the pointer atomically and is idempotent. After interruption reconcile both pending and processed pointers against the units and ledger.
- `unit stop` takes the id, attempt, state (`failed`, `blocked`, or `abandoned`), evidence, and `writerStopped: true`. Set that confirmation only after the writer has stopped or its output is fenced from integration. `standing add` takes a `line`; `standing show` reads the register. `gate park` takes id, question, options, and default; `gate resolve` takes id and answer; `gate list` lists unresolved gates.
- Concurrent writes fail rather than steal a lock. After an actual process crash, `recover` removes a lock only if its PID is dead. Never remove a live writer's lock. Keep the store on a local filesystem shared by the coordinator's commands.

#### The brief

Every spawn carries the fields below. A field you cannot fill is a unit you have not scoped yet. A cheap unit can collapse the template to a paragraph without dropping its contract.

```text
GOAL         one sentence, executable by a stranger with no chat access
SOURCE       supplied task or requirement reference; intent is not rewritten
SCOPE        allowed and forbidden paths; exclusive checkout and writer
CONTEXT      dependencies, exact integrated base, relevant upstream reports
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or available control harness, known gotchas
TIMEBOX      runtime estimate and partial-result behavior on expiry
FORBIDDEN    unit-specific bans; no unrelated fixes or shared Git mutations
REPORT       unit, attempt, status, revision, receipts, deviations, follow-ups
STANDING     current standing orders
```

#### Steps

1. **Frame.** State the countable done predicate against the supplied work. Record starting branch, dirty files, acceptance criteria, and exclusions. Derive the smallest safe units, dependencies, file boundaries, and concurrency cap. Keep coupled code under one owner, not one agent per checkbox. If one owner can finish, use the matching engineering playbook, optionally under Autonomous run, without the store machinery. Surface missing requirements rather than inventing a specification. Present the framing once. A request to describe the approach is not execution authorization.
2. **Install the runtime.** Run `init`, open the decision trail, register standing orders, add units in dependency order, and write their briefs. Discover actual status, cancellation, and notification capabilities before promising monitoring. Honor the user's runtime or spend budget if supplied.
3. **Pilot.** Push one representative unit through brief, implementation, independent verification where needed, integration, and integrated acceptance checks. Fix the brief and verify recipe before fan-out. For cheap near-identical units, the first normal unit is the pilot; a separate verifier rerunning one trivial command is ceremony.
4. **Scale.** Spawn a rolling window of ready owners and refill as they finish. Recompute ready work after each drain. Each owner uses the appropriate retained playbook. Dependencies must be verified in the integrated state the next owner receives. If a source requirement changes, hold affected units and re-scope against the new authorized input. Do not silently accept obsolete work.
5. **Drain.** Queue completion pointers and finish the critical section first. Critical sections are brief authoring, integration, conflict decisions, gates, and ledger updates. Drain at safe boundaries, classify every pointer, record effects, then acknowledge. Late attempts may offer unique findings but cannot replace accepted revisions. Every worker must be accounted for. Report tracked changes and gates, not repeated unchanged tables. Background calls wait for their actual completion notification when no independent work remains; a new call or resume is not a status probe.
6. **Integrate.** Integrate continuously, not as a terminal phase. One integration writer applies scoped verified results. Review the actual diff and receipts, then verify affected behavior against the integrated revision before marking done or releasing dependencies. A changed revision invalidates affected evidence. Full-program acceptance still runs before close. No implicit push, PR, merge service, or stack management.
7. **Close.** Reconcile every worker and inbox pointer, verify the predicate on the real integrated artifact, and compare completion against the supplied tasks. Failed, blocked, or abandoned required units mean incomplete, not success. Audit the decision trail and preserve the store as the handoff/postmortem. Report task-to-unit completion, integrated revision, checks and evidence, outstanding gates, and the store/trail paths.

#### Verification, failure, and recovery

Scale verification to the unit. Cheap commands may be run by the owner with coordinator receipt checks. Expensive, judgment-laden, or high-blast-radius work gets an independent verifier through existing review skills, preferring a different configured model ID without inventing a fallback. Behavioral changes need live evidence on the actual surface where appropriate. Do not restore mandatory lane counts or universal perf ceremonies. Follow supplied criteria and real risk. CI green is an input, not a verdict.

Count progress by side effects and receipts, not reassurance. Read status without resuming an agent. On cap-hit or OOM, shrink scope; on network failure, retry the scope; on unknown failure, retry once. Cap retries at two, then report/replan without dropping required coverage. Model failures follow the shared model contract, not silent switching. Do not replace a writer until cancellation or isolation is established. If cancellation is unavailable, hold its scope and checkpoint instead of launching an overlapping writer. A plateau warrants a new hypothesis, not fabricated completion.

On hold, stop dispatch and request zero writes from every owner using supported controls. Record anything still active. Reuse Pause safely and Session pickup for durable handoff and resumption; never assume a restart killed all workers. Reconcile store, actual Git state, worker activity, source inputs, and receipts before starting replacements. No automatic restart recovery or timed wakeup is claimed without an established runtime mechanism.

Irreversible actions, unresolved product/preference calls, changed intent, and genuine dead ends reach the human as gates. Reversible mechanics within the supplied scope do not. Mid-run discoveries fix only authorized blockers; everything else is reported as follow-up work.

**Reply:** the predicate and evidenced count against it, source tasks and their units, integrated revision, verification summary, active/blocked/abandoned work and why, human gates, and store/trail paths. Numbers come from records, not narrative.
