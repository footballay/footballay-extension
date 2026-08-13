# rules.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## use Korean on code comments and chats

- Developers of this project are Korean. So we prefer to use Korean for comments.
- Do not use Korean in code.
- It is able to use English on comments for terms and names.

## use Korean on local plans and project notes

- Write local planning documents in Korean by default.
- Files under `plan/` are for the Korean-speaking project owner to read and revise.
- Keep API paths, type names, enum values, commands, and code identifiers in English exactly as they are.
- Use English only when preserving source terms is clearer than translating them.

## separate view and data logic

- Keep UI view components separate from data fetching, caching, polling, mapping, and browser runtime messaging.
- `popup` and `content overlay` should behave as views that render state and dispatch user intents.
- `content script` should own page-local application runtime state such as selected fixture, match data, endpoint-specific ETags, polling lifecycle, visibility handling, and stale-response protection.
- `background` should remain a stateless privileged transport and browser-permission boundary. It may perform Footballay API calls, attach headers such as `If-None-Match`, interpret transport-level responses such as HTTP 304, and return validated message responses.
- `background` should not own polling timers, selected fixture state, match data cache, ETag state across requests, or page-session runtime state.
- Do not rely on service worker globals surviving across events.
- Use mapper/type modules between backend DTOs and UI-facing DTOs only when there is a real semantic transformation or normalization need. Do not add mappers speculatively.
- External libraries such as `zustand` or `axios` are allowed when they reduce real complexity, but do not introduce them speculatively.

## Match Data polling

- Match Data polling belongs to the Content runtime.
- Poll the four endpoints independently: `status`, `lineup`, `events`, `statistics`.
- Do not introduce an aggregate `GET_MATCH_DATA` request merely to bundle these independent calls.
- Keep one ETag per endpoint.
- Initial load may request without ETags; later refreshes should send each endpoint's own ETag.
- `304 Not Modified` keeps the existing data. If the response contains a new ETag, update the stored ETag.
- `200` updates only that endpoint's data and ETag.
- One endpoint failure must not prevent other successful endpoint updates.
- Ignore stale responses from a previously selected fixture.
- Polling should stop while the page is hidden and resume with an immediate refresh when visible again.
- Do not create catch-up polling bursts.
- Temporary execution state such as timer IDs or in-flight flags should stay local to the polling lifecycle unless another consumer actually needs it.

## Code Dump

- When a `code dump` is requested, identify all changed files and append the **entire contents of those files** to the designated code dump file, located in a specific directory such as `{projectRoot}/plan`.
- The dump must include all lines of each changed file, not only the modified lines.
- To avoid unnecessary token usage, do **not** read the full contents of the changed files into the model context just to create the dump.
- Instead of reading the files and patching their contents into the code dump file, use shell commands to copy or append the file contents directly.
- After generating the dump, verify that it actually contains the requested code and is not empty or only shell error output.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
