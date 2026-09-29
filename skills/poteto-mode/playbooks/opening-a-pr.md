### Opening a PR

Run only when the user explicitly requests a PR. The default finish is a verified local change and a report.

1. **Confirm the scope and target.** Inspect the current diff, commits, branch, and remote. Use the requested base, or the repository's actual default branch. Work in the current checkout; use a separate worktree only when isolation is needed. Create a topic branch if the change is on the base branch. Preserve unrelated work.
2. **Review and verify.** Clean the diff per `../references/opencode.md`, run `/no-comments`, and address accepted review findings. Reuse completed review and verification that still cover the final diff; run any missing checks. Report unavailable checks honestly.
3. **Prepare the commits and prose.** Keep commits small and ordered, staging only the scoped files. Write the title, description, and commit messages with `/technical-writing`, then apply `/unslop`. Use a Conventional Commits title, `type(scope): subject`, with a short imperative subject and no trailing period.
4. **Create the PR.** Use the repository's available forge tool (`gh` for GitHub). Push the scoped branch to the intended remote. Check for an existing PR for that head and base before creating a duplicate; reuse it when appropriate. For GitHub, write the description to a file and run `gh pr create --base <base> --head <branch> --title <title> --body-file <body-file>`. Honor a requested draft state. If access is unavailable, report the blocker and provide the prepared title and body.
5. **Return the URL.** Read back the created PR to confirm its target and state. This flow ends with the PR URL and verification summary.

The description is a briefing. Use `Why`, `Scope`, and `Verification`; add `Tradeoffs` or `Blast Radius` when useful. Name the intent, the affected code, and the actual checks and outcomes. Link longer evidence and attach screenshots or videos when they prove a claim.

**Reply:** the PR URL, what changed, verification results, and any remaining gaps.
