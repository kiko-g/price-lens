---
name: commit-with-suggested-message
description: >-
  Proposes a commit message from the current git changes and runs git commit.
  Use when the user invokes /commitwithmessage, asks to commit with a suggested
  message, says "stage and commit", "commit everything", or wants the agent to
  finish the commit after reviewing the diff.
---

# Suggest message and commit (`/commitwithmessage`)

Follow the same **message style** as [suggest-commit-message](../suggest-commit-message/SKILL.md): imperative subject, optional type prefix, optional body when the diff warrants it, no invented details.

## Safety (non-negotiable)

- Do **not** use `git commit --no-verify` unless the user explicitly asks.
- Do **not** `git push`, `git reset --hard`, rebase, or amend unless the user explicitly asks.
- Do **not** fabricate a commit if there are **no changes** to record.

## Staging rules

1. Run `git status -sb` first.

2. **Something already staged** (`git diff --cached --stat` non-empty):
   - Review **staged** diff only: `git diff --cached`
   - Propose the message, then commit **staged** content:  
     `git commit -m "subject"` or `git commit -m "subject" -m "body"` for a body.

3. **Nothing staged** but the worktree has changes:
   - If the user said **all / everything / stage and commit** (or equivalent): run `git add -A`, then `git diff --cached`, then propose message and `git commit`.
   - Otherwise: show `git status`, propose the message, and **ask** whether to stage with `git add -A` or specific paths before committing. Do not run `git add` until that scope is clear.

4. **Unrelated changes** mixed together: say so, recommend **split commits**, and do not squash distinct concerns into one commit unless the user insists.

## Commit command

- Single-line subject only: `git commit -m "subject"`
- Subject + body: `git commit -m "subject" -m "body"` (add more `-m` only if needed for short paragraphs).
- After committing, show `git log -1 --oneline` (and mention if anything remains unstaged).

## If there is nothing to commit

Report that from `git status` and stop — no empty commit.
