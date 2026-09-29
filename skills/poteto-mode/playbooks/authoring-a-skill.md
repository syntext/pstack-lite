### Authoring or modifying a skill

**You own the skill's voice.**

1. Write a directory-based OpenCode skill at `.opencode/skills/<id>/SKILL.md` (or the selected personal skill directory). Keep supporting files beside it. Use YAML `name` and `description`; the directory name is the skill ID. For explicit-only discovery use `metadata: { opencode/autoinvoke: false }`. Read the current V2 skills documentation if changing discovery behavior.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve.
3. Test cases if structural. Skip if subjective.
4. Review the skill and report its location and validation results. If the user requested a PR, run **Opening a PR**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
