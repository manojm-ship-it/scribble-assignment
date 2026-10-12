# Research: Result, Restart & Final Validation

Clarifications resolved in `spec.md` (session 2026-10-12): the host may restart mid-round, and
the "Exit Game" button is removed. No dependencies are added.

## R1. Revealing the word in the result

- **Decision**: `toRoomSnapshot` includes `secretWord` when the viewer is the drawer **or** the
  room's status is `"ended"`.
- **Rationale**: FR-001 with a one-condition change in the single visibility function (features
  002 R4 and 003 R5). The word stays drawer-only while the round is playing, so feature 002's
  FR-007 still holds for the active round.

## R2. Restart endpoint and rules

- **Decision**: `POST /rooms/:code/restart` with `{ participantId }`, validated by
  `restartGameSchema` ("A participant id is required to restart the game."). The service
  `restartGame(code, participantId)` checks, in order: room exists (404 "This room is no longer
  available."), status is not `"lobby"` (409 "The game has not started yet."), requester is host
  (403 "Only the host can restart the game."). It then sets `status = "lobby"`, `drawerId =
  null`, `secretWord = null`, `guesses = []`, every `score = 0`, and keeps `participants`,
  `hostId` and `gamesStarted`.
- **Rationale**: The status check comes first so "anyone attempts to restart a lobby room"
  (US2.6) and the duplicate-restart edge case both answer "not started yet" regardless of who
  asks. Keeping `gamesStarted` gives the next game the next word (FR-008). A separate schema keeps
  the error message accurate instead of reusing the start schema's wording.
- **Alternatives considered**: Re-creating the room (would change the code and participant ids,
  breaking FR-006).

## R3. Returning every player to the lobby

- **Decision**: The game screen, which already polls every 2 s (feature 003 R6), navigates to
  `/lobby` whenever the snapshot's status is `"lobby"`. The host's restart response updates the
  store immediately. The lobby only forwards to `/game` on `"playing"`, so there is no loop.
- **Rationale**: FR-007 with polling only; no new mechanism.

## R4. Result presentation

- **Decision**: A new `RoundResult` card on the game screen, shown when status is `"ended"`:
  "The word was <word>", final scores sorted by score descending (stable sort keeps join order
  for ties), and the host's "Play again" button or the waiting message for others. The full
  history stays in the existing Activity panel, which already shows revealed text with ✓ once the
  round has ended (feature 003, T015). During a round the host gets an "End game and return to
  lobby" button that calls the same restart.
- **Rationale**: Reuses the existing history panel; one small component for the result-only
  parts.

## R5. Removing "Exit Game"

- **Decision**: Delete the button from `GamePage.tsx`.
- **Rationale**: Clarified; it only ever produced the bounce (feature 001 risk). Restart now
  returns players to the lobby.

## R6. Testing approach

- **Decision**: vitest for restart rules (non-host, lobby, host from `ended`, host mid-round,
  duplicate restart), reset contents (status, scores, guesses, drawer, word, participants and host
  unchanged), word revealed to all viewers when ended, and next game's word using the incremented
  count; API client test for the restart request. Result screen and navigation in a two-tab check,
  and a full create → play → result → restart → play again cycle (SC-005).
