# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Create the spec branch from `feat/wine-cellar`, never from `main`:
   - If there are uncommitted changes other than `context/current-feature.md` (written by `load`), stop and ask
   - `git switch feat/wine-cellar` and `git pull --ff-only`
   - `git switch -c spec/<n>-<name>`: `<n>` is the spec number, `<name>` is the H1 feature name in kebab-case (e.g. `spec/2-api-data`)
4. Set Status to "In Progress"
5. List the goals, then implement them one by one, checking each off (`- [x]`) as it is done
6. When all goals are done, run the typecheck and tests from CLAUDE.md, then summarize what changed and how to verify it (the Testing steps from Notes)
