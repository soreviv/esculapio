# Skill: Git Add + Commit + Push

Automates the full git publish flow with an AI-generated commit message.

## Steps

1. Run `git status` and `git diff` in parallel to understand what changed.
2. If there are no changes (clean working tree), tell the user and stop.
3. Analyze the diff and generate a concise conventional commit message:
   - Format: `type: short description` (e.g. `feat:`, `fix:`, `refactor:`, `chore:`)
   - Max 72 characters for the subject line
   - Focus on *why* or *what* changed, not the mechanics
   - Use Spanish for user-facing feature descriptions, English for technical ones — match the style of recent commits (`git log --oneline -10`)
4. Show the user the proposed commit message and the list of files to be staged. Ask for confirmation before proceeding.
5. Upon confirmation:
   - `git add .`
   - `git commit -m "<message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`
   - `git push`
6. Report the result. If push fails (e.g. diverged branch), show the exact error and suggest the fix without running destructive commands.

## Rules

- NEVER force-push.
- NEVER skip hooks (--no-verify).
- NEVER commit if the only changes are in `ecosystem.config.cjs` — warn the user instead, as that file contains secrets.
- If the diff is very large (>300 lines), summarize by file group rather than line-by-line.
