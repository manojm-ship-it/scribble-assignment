# Reflection — Scribble Lab

This report covers the brownfield enhancement of the Scribble starter on branch `scribble-lab`:
four Spec Kit feature groups, built and validated in order. The supporting artifacts are
`docs/discovery.md`, `.specify/memory/constitution.md` and `specs/001`–`004`.

## What did the starter app already have?

- **Backend** (Express, Zod, in-memory `Map`): create a room, join it by code, and fetch a room
  snapshot.
- **Frontend** (React, React Router): Start, Create, Join, Lobby and Game screens, with a lobby
  that only updated through a manual "Refresh Room" button.
- **Placeholders**: the game screen had a canvas area, a guess form that discarded input, and a
  static scoreboard and activity panel.
- **Seed data**: five words and two roles.
- **Tests**: 4 backend and 2 frontend, all passing.

Discovery found 10 gaps. Four affected the plan most:

- **Default API URL**: it ended in `/bug`, so every request failed until `VITE_API_URL` was
  set.
- **Missing state**: there was no host, drawer, word, guess or score anywhere in the model.
- **Snapshots ignored the viewer**: room snapshots discarded the viewer id and sent the full word
  list to every player.
- **Inactive rooms were never removed.**

## What did I add?

| Feature | Scenario | Main additions |
|---|---|---|
| 001 Room & lobby | 1 | Fixed the API URL; the creator is host; room codes are validated with clear messages; late joins refused; lobby polls every 2 s; host-only start with 2+ players; rooms idle for 30 min are removed |
| 002 Start & drawer | 2 | Names trimmed, required, max 20 characters; host becomes drawer; deterministic word; word sent only to the drawer; word and role lists no longer sent |
| 003 Gameplay | 3 | Drawer-only canvas with clear; guess endpoint with trim, case-insensitive match, 100/0 scoring and refusals; live history and scoreboard; correct answers hidden until the round ends; round ends when every guesser is correct |
| 004 Result & restart | 4 | Word, final scores and full history for everyone; host "Play again" and mid-round "End game"; full reset with players kept; removed the bouncing "Exit Game" |

**By the numbers:**
- **Commits**: 35 before this report, each implementation commit referencing its feature and
  task IDs.
- **Code**: 22 source files changed (+1,269 / −91).
- **Tests**: 68 backend and 7 frontend tests as counted by vitest (up from 4 and 2).

The full flow works in two browsers: create, join, play, see the shared result, restart and
play again, with no page reloads.

## How AI was used

I used Claude Code with GitHub Spec Kit for every step:
- **Spec Kit steps**: constitution, specify, clarify, plan and tasks.
- **Implementation and validation**: code, tests, API checks, and browser checks driven through
  Chrome on `localhost` only.

The decisions that shaped the game were mine. They came up as clarification questions with a
recommended option and its trade-offs, and are recorded in each spec. Eleven were answered
across the four features:

- **Rules**: the word rule `(sum of the room code's character codes + games started) mod 5`,
  a 20-character name limit, duplicate names allowed, and no joining a game in progress.
- **Round flow**: the round ends when every guesser is correct, and the host can restart
  mid-round.
- **Visibility**: the canvas is drawer-only, correct guesses stay hidden until the round ends,
  and the word list is no longer sent.
- **Clean-up**: rooms expire after 30 minutes, and "Exit Game" was removed.

Guardrails kept the AI's output checkable:
- **Constitution**: six principles, including "server-authoritative rules" and "reviewed,
  traceable AI assistance".
- **Pass/fail gates**: a local script runs the same four checks as the PR, and a pre-push hook
  runs it automatically.
- **Progress tracker**: each item counts as done only when its checks have actually run and
  passed.

### Where AI output was wrong, and was caught

1. **Discovery folder layout**: the first plan put the discovery notes in `specs/000-discovery/`.
   Reading the pre-evaluation script showed that any `specs/NNN-*` folder without
   spec, plan and tasks fails the check, so the notes moved to `docs/discovery.md`.
2. **Start error message**: validation found that a missing `participantId` on start returned
   Zod's default "Required" instead of a readable message. Fixed with a test.
3. **Network error message**: with the server down, the lobby showed the browser's raw "Failed to
   fetch". It now says "Can't reach the game server…".
4. **Test harness**: `lsof -ti tcp:3001 | xargs kill` also killed Chrome's network process,
   which reloaded the test tabs, so the first result was misleading. Spotted from the page
   reload in the console; the check was re-run stopping only the listening server.
5. **Validation plan logic**: feature 003's two-tab plan could never show a hidden correct guess,
   because with one guesser the round ends at once and the answer is revealed. Moved to three
   tabs before running.
6. **Layout**: the "Round over!" notice reused a `width: max-content` style and pushed the sidebar
   past the panel. Seen in a screenshot and fixed.
7. **Store design**: the first plan reused the store's `error` field for the "room no longer
   available" notice. That would have shown stale create/join errors on the start screen, so a
   separate `notice` field was used instead.

Each one is recorded in the relevant `plan.md` "Deviations" section or `tasks.md` validation
results.

## Tradeoffs and decisions

- **Polling every 2 s.** Required by the constitution (no push protocols). It is simple and
  observable, but a change takes up to 2 s to appear and every open screen makes a request every
  2 s. That suits a small lab game.
- **Drawer-only canvas.** This matches Scenario 3's wording ("visible on the drawer's screen").
  It keeps strokes off the server and polling, so guessers rely on the drawer describing, not
  seeing. Sharing strokes by polling was considered and rejected as unjustified scope.
- **Deterministic word.** The rule is testable and explainable, and different rooms usually get
  different words. The cost is that someone who knows the rule can predict the word.
- **One visibility function.** `toRoomSnapshot` decides everything a viewer may see: the word,
  hidden correct guesses, and the reveal after the end. Keeping it in one tested function made
  the fairness rules easy to reason about.
- **Identity is a `participantId` in memory.** No accounts, sessions or persistence, as required.
  Refreshing a tab loses the player's identity; this is documented as an accepted limitation.
- **Host can always restart.** This avoids rooms stuck on a word nobody can guess. The cost is
  that the host can cut a round short.

## Deviations from the plans

All deviations are recorded in each feature's `plan.md`. They are small:
- **Build-driven task grouping**: T003 + T008 (feature 001) and T009–T011 (feature 004) share
  commits, and feature 003 wired the guess form into the game page early (with T010). Each was
  needed to keep the build passing between commits.
- **Notice field**: a separate `notice` field was used instead of reusing `error`.
- **Validation fixes**: three fixes found during validation (two messages and one layout issue).
- **Preserved case**: stored guesses keep the guesser's capitalisation (only the comparison
  ignores case).

There were no deviations from the scenarios or the constitution.

## Known limitations

- **Refresh loses identity**: refreshing the browser makes the player an unknown viewer.
- **Name-only player list**: duplicate names are allowed. Your own entry is marked "(you)", but
  others see only names.
- **No guess length limit**: guess text has no maximum (not in the spec).
- **No leaving a room**: there is no "leave room" action; idle rooms expire after 30 minutes.

## Verification

- **Automated**: each feature was checked with `npm run build` and `npm test` in both apps.
- **API checks**: every rule and refusal message was exercised with `curl` against a live
  backend.
- **Browser checks**: two to four tabs per feature (four, across two rooms, for the final
  end-to-end run), with results recorded in each `tasks.md`, plus regression checks of earlier
  features where code was shared.
- **PR checks**: the local `temp/run-pr-checks.sh` mirrors the four PR checks and runs on every
  push via the pre-push hook. On GitHub, CI passes for both apps.
