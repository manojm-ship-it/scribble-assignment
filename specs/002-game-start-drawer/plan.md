# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Validate player names (trimmed, 1–20 characters) on the server for create and join; when the
host starts, record the host as drawer and pick the secret word with the clarified rule
`(Σ room-code char codes + gamesStarted) mod 5`; send the word only in the drawer's room view
and stop sending the candidate word and role lists. The game screen shows who is drawing, the
viewer's role, and — for the drawer only — the word. Decisions: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24.13.0, ES modules

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6 (frontend). No
new dependencies.

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`

**Testing**: vitest (backend and frontend); manual two-tab checks

**Target Platform**: Local development (backend :3001, frontend :5173)

**Project Type**: Web application (`backend/` + `frontend/`)

**Performance Goals**: Drawer sees the word as soon as the start response arrives; guessers see
the drawer within one lobby poll (~2 s)

**Constraints**: HTTP polling only; in-memory; no authentication

**Scale/Scope**: Small rooms; one round per start

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Evidence |
|---|---|---|
| I. Brownfield discipline | ✅ Pass | Extends existing model, schema, service and pages; removes only code this change orphans (R2, R5) |
| II. Server-authoritative, deterministic rules | ✅ Pass | Name rules in Zod; host = drawer and word rule in `startGame`; visibility in `toRoomSnapshot` |
| III. Scope boundaries | ✅ Pass | No rotation, rounds, timers or custom words; restart behaviour deferred to 004 |
| IV. Typed, validated, layered | ✅ Pass | Shared `playerNameSchema`; pure `selectSecretWord`; routes unchanged in shape |
| V. Verified before committed | ✅ Pass | Unit tests per rule (R8); quickstart API and two-tab checks |
| VI. Reviewed AI assistance | ✅ Pass | Tasks trace to FRs; deviations recorded below |
| Polling / in-memory / no auth | ✅ Pass | No new sync mechanism; identity stays `participantId` |

**Post-design re-check**: ✅ Pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/rooms-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (files touched)

```text
backend/src/
├── models/game.ts               # Room: drawerId, secretWord, gamesStarted; snapshot: drawerId, secretWord?; drop availableWords/roles
├── api/schemas.ts               # playerNameSchema used by createRoomSchema and joinRoomSchema
├── api/schemas.test.ts          # name cases
├── services/roomStore.ts        # remove "Player" fallback and listWords; selectSecretWord; startGame sets drawer/word; viewer-aware snapshot
└── services/roomStore.test.ts   # word rule, drawer, visibility

frontend/src/
├── services/api.ts              # snapshot type: drawerId, secretWord?; drop availableWords/roles/ParticipantRole
└── pages/GamePage.tsx           # "<name> is drawing", role line, word card for the drawer only

specs/001-room-lobby/quickstart.md   # curl join lines now send a name (R7)
```

**Structure Decision**: Same two-package layout and layering as feature 001; no new folders.

## Data Flow

1. **Create / join**: form → API → `createRoomSchema` / `joinRoomSchema` trims and checks the
   name (400 with the message on failure) → service stores the trimmed name.
2. **Start**: host → `POST /rooms/:code/start` → `startGame` checks (feature 001), then sets
   `drawerId = hostId`, `secretWord = selectSecretWord(code, gamesStarted)`, `gamesStarted += 1`
   → `toRoomSnapshot(room, hostId)` includes the word → host's store → `/game`.
3. **Others**: lobby poll → `toRoomSnapshot(room, viewerId)` without the word → `status:
   "playing"` → `/game`.
4. **Game screen**: reads `drawerId`, `participants`, `participantId` and `secretWord` from the
   store to show the drawer's name, the viewer's role and (drawer only) the word.

## Implementation Sequence

1. Name schema + tests; remove the fallback; update feature 001 quickstart lines.
2. Model fields; `selectSecretWord` + tests; `startGame` drawer/word + tests.
3. Viewer-aware snapshot without word/role lists + visibility tests; frontend types.
4. Game screen labels and word card.
5. Validation (quickstart §1–§3), results in `tasks.md`.

## Testing Strategy

- **Backend unit**: FR-001/002/003 (schema: missing, empty, spaces, trimming, 20 vs 21);
  FR-004 (drawer = host); FR-006 (`ABCD` → `pizza`, count 1 → `castle`, `AAAA` → `rocket`,
  result always in the list); FR-007/008 (drawer sees word; guesser, unknown, anonymous and
  lobby views do not); FR-009 (no `availableWords`/`roles` keys).
- **Manual**: quickstart two-tab rows for FR-005 and on-screen messages.

## Risks

| Risk | Mitigation |
|---|---|
| Requiring names changes some feature 001 error orders (name checked before room lookup) | Documented (R7); 001 quickstart updated; 001 unit tests call the service directly and are unaffected |
| A refreshed tab loses its id and no longer sees the word, even for the drawer | Accepted (identity has no persistence by design); listed as an edge case in the spec |
| Game screen still bounces back from "Exit Game" (feature 001 known limitation) | Unchanged; addressed with restart in feature 004 |

## Complexity Tracking

No constitution violations to justify.

## Deviations

Any difference found during implementation is recorded here and in `REFLECTION.md`.
