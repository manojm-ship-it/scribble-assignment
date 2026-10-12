# Implementation Plan: Gameplay Interaction

**Branch**: `scribble-lab` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-gameplay/spec.md`

## Summary

Give the drawer a local canvas with clear; add a guess endpoint whose service trims guesses,
compares them case-insensitively with the secret word, refuses empty/drawer/repeat/out-of-round
guesses, scores 100 or 0, and ends the round when every guesser is correct; extend room views
with scores and a guess history that hides correct-guess text while the round is active; and
make the game screen poll every 2 seconds to show history and scores. Decisions:
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24.13.0, ES modules

**Primary Dependencies**: Express 4, Zod 3; React 18, React Router 6; browser Canvas 2D API.
No new dependencies.

**Storage**: In-memory `Map` (guesses and scores live on the room)

**Testing**: vitest; manual three-tab checks

**Target Platform**: Local development (backend :3001, frontend :5173)

**Project Type**: Web application (`backend/` + `frontend/`)

**Performance Goals**: Guesses and scores reach every screen within ~2 s (one poll)

**Constraints**: HTTP polling only; in-memory; no authentication; canvas never leaves the
drawer's browser

**Scale/Scope**: Small rooms; one round per start

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Evidence |
|---|---|---|
| I. Brownfield discipline | ✅ Pass | Reuses GuessForm, Scoreboard, ResultPanel, canvas placeholder; one new component (canvas) and one hook extracted from existing lobby code (R6) |
| II. Server-authoritative, deterministic rules | ✅ Pass | All guess rules and scoring in `submitGuess`; hiding in `toRoomSnapshot` |
| III. Scope boundaries | ✅ Pass | No timers, bonuses, rotation or extra rounds; result/restart left to 004 |
| IV. Typed, validated, layered | ✅ Pass | `submitGuessSchema`; thin route; store method; typed props |
| V. Verified before committed | ✅ Pass | Unit tests for every rule (R8); three-tab quickstart |
| VI. Reviewed AI assistance | ✅ Pass | Tasks trace to FRs; deviations recorded |
| Polling / in-memory / no auth | ✅ Pass | 2 s polling hook; guesses on the in-memory room; no stroke storage |

**Post-design re-check**: ✅ Pass.

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (files touched)

```text
backend/src/
├── models/game.ts               # Participant.score; Guess; Room.guesses; status "ended"; GuessView
├── api/schemas.ts               # submitGuessSchema
├── api/rooms.ts                 # POST /:code/guesses
├── services/roomStore.ts        # score 0 on create/join; reset on start; submitGuess; masked history in snapshot
├── services/roomStore.test.ts   # guess rules, scoring, round end, masking
└── api/schemas.test.ts          # guess text validation

frontend/src/
├── services/api.ts              # types; submitGuess
├── services/api.test.ts         # guess request shape
├── state/roomStore.ts           # submitGuess()
├── state/useRoomPolling.ts      # NEW: 2 s polling + error handling (from LobbyPage)
├── components/DrawingCanvas.tsx # NEW: pointer drawing + clear
├── components/GuessForm.tsx     # onSubmit prop, refusal message
├── components/Scoreboard.tsx    # participants with scores
├── components/ResultPanel.tsx   # guess history ("Activity")
├── pages/LobbyPage.tsx          # use useRoomPolling
├── pages/GamePage.tsx           # polling, canvas for drawer, wiring, round-over notice
└── styles/app.css               # canvas, history and scoreboard styles
```

**Structure Decision**: Existing layout; new files sit in the folders AGENTS.md assigns
(`components`, `state`).

## Data Flow

1. **Guess**: GuessForm → `RoomStore.submitGuess(text)` → `POST /rooms/:code/guesses` →
   `submitGuessSchema` (trim, non-empty) → `submitGuess` (checks, score, maybe `ended`) →
   snapshot for the guesser → store. Refusals come back as `ApiError` and show under the form.
2. **Sync**: `useRoomPolling` on GamePage → `GET /rooms/:code?participantId=` every 2 s →
   snapshot with scores and masked history → Scoreboard and ResultPanel re-render.
3. **Round end**: last guesser's correct guess sets `ended` → every poll sees it → guess form
   disabled, "Round over" notice; history reveals texts.
4. **Canvas**: pointer events on the drawer's `<canvas>` only; nothing is sent.

## Implementation Sequence

1. Model + schema + service rules with tests (score, guesses, submitGuess, reset on start,
   masking).
2. Route and API client (+ test), store method.
3. Polling hook (refactor LobbyPage onto it, behaviour unchanged).
4. Game screen: GuessForm, Scoreboard, ResultPanel wiring; round-over state.
5. DrawingCanvas for the drawer.
6. Validation (quickstart §1–§3), results in tasks.md.

## Testing Strategy

- **Backend unit**: FR-004/005 (schema trim/empty); FR-006 (case, internal spaces); FR-007
  (0 at start, +100, +0, reset on start); FR-008 (drawer, repeat, not in progress, unknown);
  FR-009 (order, fields); FR-011 (masked while playing, revealed when ended); FR-014 (ends with
  one guesser, continues until the second of two).
- **Frontend unit**: guess request shape.
- **Manual**: canvas (FR-001–003), polling (FR-010), screen texts (quickstart §3).

## Risks

| Risk | Mitigation |
|---|---|
| Refactoring lobby polling into a hook could break feature 001 behaviour | Hook keeps the same interval, 404 handling and error text; re-run 001 lobby rows during validation |
| A guesser who never gets the word leaves the round open | Accepted per clarification; feature 004 restart resets the room |
| Canvas pointer coordinates drift when the card is resized | Scale by the canvas's rendered size on every event (R1) |
| Guess text length is unbounded | Accepted for a lab game; not in spec; noted for reflection |

## Complexity Tracking

No constitution violations to justify.

## Deviations

Any difference found during implementation is recorded here and in `REFLECTION.md`.

- **T008–T010 wired GuessForm into GamePage early.** Making `onSubmit` required broke the build
  until GamePage passed it, so a minimal hookup (store call, disabled for the drawer) landed with
  T010; T016 completed the wiring.
- **Round-over notice styling (T022).** `.status-line` uses `width: max-content`, which pushed
  the sidebar past the panel; the notice is a plain paragraph instead (`93ca5d6`).
- **Stored guess text keeps the guesser's case** (e.g. `GuItAr`), as the spec records the
  trimmed text; only the comparison ignores case.
