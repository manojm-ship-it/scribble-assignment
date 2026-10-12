# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribble-lab` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Reveal the secret word to every player once the round has ended; show a result card with the
word, final scores (highest first) and — via the existing Activity panel — the full history; add
a host-only restart endpoint usable from an active or ended round that returns the room to the
lobby with players and host kept and all round state cleared; route every game screen back to
the lobby on the next poll; and remove the bouncing "Exit Game" button. Decisions:
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24.13.0, ES modules

**Primary Dependencies**: Express 4, Zod 3; React 18, React Router 6. No new dependencies.

**Storage**: In-memory `Map`

**Testing**: vitest; manual two-tab checks including a full play-again cycle

**Target Platform**: Local development (backend :3001, frontend :5173)

**Project Type**: Web application (`backend/` + `frontend/`)

**Performance Goals**: Result and restart reach every screen within ~2 s (one poll)

**Constraints**: HTTP polling only; in-memory; no authentication

**Scale/Scope**: One round per game; unlimited restarts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Evidence |
|---|---|---|
| I. Brownfield discipline | ✅ Pass | One new component (RoundResult); reuses Activity panel and polling hook; removes only the defective button |
| II. Server-authoritative, deterministic rules | ✅ Pass | Restart permissions and reset in `restartGame`; reveal in `toRoomSnapshot`; next word by the existing rule |
| III. Scope boundaries | ✅ Pass | No multi-round games, leaderboards, leave or kick |
| IV. Typed, validated, layered | ✅ Pass | `restartGameSchema`; thin route; store method |
| V. Verified before committed | ✅ Pass | Unit tests per rule (R6); two-tab checks and full cycle |
| VI. Reviewed AI assistance | ✅ Pass | Tasks trace to FRs; deviations recorded |
| Polling / in-memory / no auth | ✅ Pass | Navigation driven by the existing 2 s poll |

**Post-design re-check**: ✅ Pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (files touched)

```text
backend/src/
├── api/schemas.ts               # restartGameSchema
├── api/rooms.ts                 # POST /:code/restart
├── services/roomStore.ts        # restartGame; reveal word when ended
├── services/roomStore.test.ts   # restart rules and reset; reveal; next word
└── api/schemas.test.ts          # restart body

frontend/src/
├── services/api.ts              # restartGame
├── services/api.test.ts         # restart request shape
├── state/roomStore.ts           # restartGame()
├── components/RoundResult.tsx   # NEW: word, ordered final scores, Play again / waiting
└── pages/GamePage.tsx           # RoundResult when ended; host "End game" mid-round; navigate to /lobby on "lobby"; remove Exit Game
```

**Structure Decision**: Existing layout; the new component goes in `components/`.

## Data Flow

1. **Round ends** (feature 003) → status `ended` → every poll returns the word and revealed
   history → GamePage shows RoundResult and the Activity panel with ✓ marks.
2. **Restart**: host clicks "Play again" (or "End game and return to lobby") →
   `RoomStore.restartGame()` → `POST /rooms/:code/restart` → `restartGame` checks and resets →
   lobby snapshot → host's GamePage navigates to `/lobby`; others navigate on their next poll.
3. **Play again**: lobby start (feature 001) → `startGame` uses the kept `gamesStarted` for the
   next word.

## Implementation Sequence

1. Backend: reveal-when-ended + tests; `restartGame` + schema + route + tests.
2. Frontend: API client + test; store method.
3. GamePage: navigate on lobby; RoundResult; host mid-round control; remove Exit Game.
4. Validation: quickstart §1–§3, results in tasks.md.

## Testing Strategy

- **Backend unit**: FR-001 (word to guesser/anonymous when ended, still hidden while playing);
  FR-004/005 (non-host, lobby, duplicate); FR-006 (reset fields, participants and host
  unchanged); FR-008 (next word uses count 1); mid-round restart.
- **Frontend unit**: restart request shape.
- **Manual**: FR-002/003/007/009/010 on screen; SC-005 full cycle.

## Risks

| Risk | Mitigation |
|---|---|
| Revealing the word when ended weakens feature 002's drawer-only rule | Only after the round ends, when guessing is closed (feature 003); unit test pins "hidden while playing" |
| Host's tab could navigate to `/lobby` before others; lobby forwards only on `"playing"` | No loop; others follow on their next poll |
| Removing "Exit Game" leaves no way to leave a room | Accepted: leave/kick are out of scope; closing the tab works and idle rooms expire |

## Complexity Tracking

No constitution violations to justify.

## Deviations

Any difference found during implementation is recorded here and in `REFLECTION.md`.
