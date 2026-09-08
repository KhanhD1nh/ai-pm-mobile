---
name: ai-pm-mobile-precommit
description: Enforce the AI-PM Mobile pre-commit quality workflow. Use whenever ChatGPT is asked to commit, prepare a commit, finalize code changes, run pre-commit checks, format code before commit, or verify changes in the AI-PM Mobile repository. Covers safe staging, staged-file Prettier formatting, lint, TypeScript checks, repository verification, and commit reporting without disturbing unrelated working-tree changes.
---

# AI-PM Mobile Pre-commit

## Operating rule

Treat the repository `AGENTS.md` as the project-level operating prompt. Follow its requirements first, then apply this skill as the concrete commit workflow. Never weaken repository checks to make a commit pass.

## Commit workflow

When the user asks to commit or prepare changes for commit:

1. Verify that the active repository is AI-PM Mobile and inspect `git status --short` before staging anything.
2. Identify the files that belong to the current task. Preserve unrelated user changes exactly as they are.
3. Stage only the intended files. Do not use `git add .` when unrelated changes are present.
4. Run `pnpm precommit` after staging. This is the required formatting gate and runs Prettier through `lint-staged`, then lint and TypeScript checks.
5. Inspect `git status --short` and `git diff --cached` again. Confirm formatter edits are included in the staged diff and no unrelated files were pulled in.
6. Run `pnpm run verify` before committing application changes, as required by `AGENTS.md`.
7. If checks pass, create the commit with a concise message that reflects the actual staged change.
8. Report the commit hash, commit message, and verification commands that passed.

## Formatting rules

- Prefer `pnpm precommit` for normal commits because it formats only staged supported files.
- Never format generated lockfiles such as `pnpm-lock.yaml`; keep them managed by pnpm.
- Use `pnpm format` only when the user explicitly asks to format the whole repository or a deliberate repository-wide formatting migration is being performed.
- Do not make `pnpm format:check` a mandatory pre-commit gate until the repository has a clean Prettier baseline; legacy files may still be unformatted.
- After `lint-staged` modifies files, verify the staged diff instead of assuming the index contains exactly what was intended.

## Failure handling

- If `pnpm precommit` or `pnpm run verify` fails because of the current changes, fix the problem and rerun the failed checks before committing.
- If a failure is clearly pre-existing or outside the task scope, do not hide it, weaken checks, or silently expand scope. Report the blocker and distinguish it from current-task changes.
- Never discard, reset, stash, overwrite, or reformat unrelated working-tree changes unless the user explicitly asks.

## Short commands

Use these commands as the canonical workflow:

```bash
git status --short
# stage intended files only
pnpm precommit
git status --short
git diff --cached
pnpm run verify
git commit -m "<message>"
```
