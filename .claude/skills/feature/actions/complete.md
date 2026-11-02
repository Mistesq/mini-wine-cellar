# Complete Action

Never switch to, merge into or push `main`. Spec branches are never pushed.

1. On the spec branch `spec/<n>-<name>`, stage all changes and commit with a descriptive message
2. Switch to `feat/wine-cellar` and merge the spec branch with `git merge --no-ff spec/<n>-<name>` (no push yet)
3. Delete the local spec branch (`git branch -d spec/<n>-<name>`)
4. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Clear Goals and Notes sections (keep placeholder comments)
   - Add feature summary to the END of History
5. Commit the reset: `chore: reset current-feature.md after completing [feature]`
6. Push `feat/wine-cellar` to origin ONCE (single push with all changes)
