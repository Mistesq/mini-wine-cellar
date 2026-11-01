# Load Action

1. Check $ARGUMENTS (after "load"):
   - If it looks like a filename (single word, no spaces): Look for `context/features/{name}.md` OR `context/fixes/{name}.md`
   - If it's multiple words: Use as inline feature description, generate goals
   - If empty: Error - "load" requires a spec filename or feature description

2. Skip the spec's "Optional (only if time is left)" section entirely: none of its items go into Goals or Testing steps. Load optional items only when I explicitly ask for them.

3. Update current-feature.md:
   - Update H1 heading to include feature name (e.g., `# Current Feature: Add Navbar`)
   - Write goals as an unchecked checklist under ## Goals, one `- [ ]` line per goal. From a spec file, the goals come from its Requirements
   - Write notes under ## Notes: contracts, gotchas, what is out of scope, and the spec's Testing steps (review checks against them)
   - Set Status to "Not Started"

4. Confirm spec loaded, show the goals, and flag anything ambiguous I should decide before `start`
