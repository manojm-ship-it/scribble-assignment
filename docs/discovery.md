# Discovery Notes — Scribble Starter

Inspection of the starter on branch `scribble-lab` (base commit `f02bb3e`), before any feature
work. Baseline: `npm run build` and `npm test` pass in both apps (backend 4 tests, frontend 2).

## What the starter already does

- Create a room (`POST /rooms`) and receive a `participantId` plus a 4-character room code.
- Join a room by code (`POST /rooms/:code/join`); the code is upper-cased before lookup.
- Fetch a room snapshot (`GET /rooms/:code?participantId=`).
- Store rooms in an in-memory `Map` inside `backend/src/services/roomStore.ts`.
- Show the lobby participant list from the latest snapshot, refreshed by a manual button.
- Render a game page whose canvas, guess form, scoreboard and activity panel are placeholders.

## Gaps (incomplete or incorrect behaviour)

1. **Frontend points at a broken API path.** `frontend/src/services/api.ts` defaults
   `API_BASE_URL` to `http://localhost:3001/bug`, so every request 404s ("Route not found")
   unless `VITE_API_URL` is set. Must be fixed before any flow can be validated.
2. **No host concept.** `Room` in `backend/src/models/game.ts` has no host field, and
   `createRoom` in `backend/src/services/roomStore.ts` does not record who created the room.
3. **Lobby does not poll.** `frontend/src/pages/LobbyPage.tsx` only calls
   `roomStore.fetchRoom()` from the "Refresh Room" button; other players' joins are invisible
   until clicked.
4. **"Start Game" is ungated.** The lobby button just calls `navigate("/game")` for every
   player. There is no start endpoint, no host check, no 2-player minimum, and other players
   are never moved to the game.
5. **No name validation.** `createRoomSchema` and `joinRoomSchema` in
   `backend/src/api/schemas.ts` accept empty or whitespace-only names, and `displayName` in
   `roomStore.ts` silently replaces them with `"Player"`. Names are not trimmed.
6. **No room-code validation.** `roomCodeParamsSchema` accepts any string; an empty or
   malformed code is only rejected indirectly by a failed lookup with a generic 404 message.
7. **No round state.** `RoomStatus` is only `"lobby"`; there is no drawer, secret word,
   guesses, scores or result state anywhere in the model.
8. **Snapshots ignore the viewer.** `toRoomSnapshot` takes `viewerParticipantId` but discards
   it (`void viewerParticipantId`), so per-player visibility (drawer-only word) is impossible.
   It also exposes `availableWords` (the whole word list) to every client.
9. **Game UI is placeholder-only.** `GuessForm.tsx` swallows submissions, `Scoreboard.tsx` and
   `ResultPanel.tsx` render static text, and `GamePage.tsx` has no canvas.
10. **Inactive rooms are never removed.** Rooms stay in the `Map` until the process restarts,
    contrary to the in-memory footprint rule in `AGENTS.md`.

## Assumptions

1. **Identity is the `participantId`.** Players are identified only by the id returned on
   create/join and held in frontend memory; refreshing the browser tab loses it and the player
   must rejoin. This is acceptable because authentication and sessions are out of scope.
2. **The room creator is the host and also the drawer** for the single round
   (Scenario 2: "the host (or first player) becomes the drawer").
3. **"Deterministic" word selection** means the same room inputs always yield the same word
   from the 5 starter words (no `Math.random`). The exact rule is decided in
   `specs/002-*/spec.md`.
4. **Room codes are case-insensitive** for users: input is upper-cased on both client and
   server, as the starter already does.
5. **The canvas is not synced to guessers.** Scenario 3 requires the drawing to be visible on
   the drawer's screen; streaming strokes to other players is not required and would strain
   the polling-only constraint. To be confirmed during clarification of feature 003.
6. **Polling interval is 2 seconds** for both lobby and game screens, matching "~2s" in
   Scenario 1.

## Relevant files

| Area | File | Role |
|---|---|---|
| Backend model | `backend/src/models/game.ts` | `Room`, `Participant`, `RoomSnapshot` types |
| Backend logic | `backend/src/services/roomStore.ts` | In-memory rooms, create/join/get, snapshot |
| Backend routes | `backend/src/api/rooms.ts` | `/rooms` endpoints |
| Backend validation | `backend/src/api/schemas.ts` | Zod schemas, `HttpError` |
| Backend wiring | `backend/src/api/router.ts`, `backend/src/app.ts` | Router, 404 and error handlers |
| Seed data | `backend/src/seed/starterData.ts` | Starter words and roles |
| Backend tests | `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts` | Existing vitest suites |
| Frontend API | `frontend/src/services/api.ts` | Typed fetch client (has the `/bug` default) |
| Frontend state | `frontend/src/state/roomStore.ts` | `RoomStore` external store pattern |
| Frontend pages | `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx` | Lobby and game screens |
| Frontend pages | `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx` | Entry forms |
| Frontend components | `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx` | Game placeholders |
| Frontend routing | `frontend/src/routes/index.tsx` | Route table |

## Mapping to feature groups

| Gap | Feature folder |
|---|---|
| 1, 2, 3, 4, 6, 10 | `specs/001-room-lobby` |
| 5, 7 (drawer, word), 8 | `specs/002-game-start-drawer` |
| 7 (guesses, scores), 9 | `specs/003-gameplay` |
| 7 (result), restart | `specs/004-result-restart` |
