---
name: suggest-commit-message
description: >-
  Proposes one or more git commit messages from the current working tree or a
  given diff. Use when the user invokes /suggestcommitmessage, asks for a commit
  message, PR title, or "what should I commit this as", or before they run git
  commit.
---

# Suggest commit message (`/suggestcommitmessage`)

## When invoked

1. **Inspect the change set** (unless the user pasted a diff or listed files):
   - `git status -sb`
   - `git diff` for unstaged, or `git diff --cached` if they said staged only, or both if unclear
   - For scope, optionally `git log -1 --oneline` for recent style in this repo

2. **Summarize in your own words** what changed: areas touched, user-visible impact, risk (migrations, breaking changes).

3. **Output** (in order):
   - **Recommended subject line** — imperative mood, ≤72 characters if possible, specific (not "fix stuff" / "updates").
   - **Optional body** — use when the diff is non-obvious, spans multiple concerns, or needs rollout/notes. Complete sentences; no filler.
   - **Alternatives** — at most 1–2 other subject lines if the change legitimately fits different scopes (e.g. `fix` vs `refactor`).

## Style (this project)

- Prefer **clear, grammatical** phrasing over jargon stacks.
- Match **breadth to the diff**: small change → short subject only; large or risky change → subject + short body.
- Use a **type prefix** when it helps scan history: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `i18n`, etc. Optional scope in parentheses if obvious from paths (e.g. `fix(search): …`).
- **Do not** invent a detailed body from guesses; only describe what the diff supports.
- If there are **unrelated changes**, say so and suggest **splitting into separate commits** with example subject lines per commit.

## If there is nothing to commit

Say so and mention `git status` — do not fabricate a message.

## Actually committing

When the user wants the message **and** a `git commit` run (staging rules, hooks), use [commit-with-suggested-message](../commit-with-suggested-message/SKILL.md) (`/commitwithmessage`).
