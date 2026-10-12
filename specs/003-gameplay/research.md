# Research: Gameplay Interaction

Clarifications resolved in `spec.md` (session 2026-10-12): the round ends when every guesser is
correct; the canvas is drawer-only; correct-guess text is hidden while the round is active.
No dependencies are added (constitution, Principle I).

## R1. Canvas implementation

- **Decision**: A `DrawingCanvas` component using the browser's `<canvas>` 2D context and
  pointer events (`pointerdown/move/up`, so mouse and touch share one path). Fixed internal
  resolution 800×500, scaled to the card width with CSS; pointer positions are scaled by
  `canvas.width / rect.width`. "Clear canvas" calls `clearRect` on the whole surface. Rendered
  only for the drawer; guessers get the existing `canvas-placeholder` with "<name> is drawing".
- **Rationale**: Clarified as drawer-only, so no stroke data leaves the browser and nothing is
  stored on the server (keeps the in-memory footprint unchanged).
- **Alternatives considered**: A drawing library (unjustified dependency); SVG paths in React
  state (re-renders per pointer move for no benefit).

## R2. Guess endpoint

- **Decision**: `POST /rooms/:code/guesses` with body `{ participantId, text }`, validated by
  `submitGuessSchema` (`text` required, trimmed, non-empty → "Enter a guess."). Returns
  `{ room }` as seen by the guesser.
- **Rationale**: Same shape as the start endpoint (feature 001, R4); trimming in the schema
  satisfies FR-004/FR-005 before the service runs.

## R3. Guess rules in the service

- **Decision**: `submitGuess(code, participantId, text)` checks, in order: room exists (404
  "This room is no longer available."), round active (409 "The round is not in progress."),
  participant is in the room (403 "You are not a player in this room."), not the drawer (403
  "The drawer cannot guess."), not already correct (409 "You already guessed the word."). Then
  `correct = text.toLowerCase() === secretWord.toLowerCase()`, append the guess, add 100 if
  correct, and set `status = "ended"` when every non-drawer participant has a correct guess.
- **Rationale**: All rules in one tested function (FR-013). Checking the round state first
  means a finished round always answers "not in progress", whoever asks.
- **Alternatives considered**: `localeCompare` with sensitivity options (unnecessary for the
  ASCII starter words; plain lower-casing is predictable and easy to test).

## R4. Where scores live

- **Decision**: `Participant` gains `score: number` (0 on create/join). `startGame` resets every
  score to 0 and clears `guesses`, so a later restart (feature 004) starts clean.
- **Rationale**: The scoreboard needs name + score per player, which the participant list
  already carries; no parallel map to keep in sync.

## R5. Hiding correct guesses

- **Decision**: `toRoomSnapshot` maps each stored guess to `{ id, participantId, text, correct }`
  where `text` is `null` for correct guesses while `status === "playing"`. After the round ends
  the real text is sent.
- **Rationale**: FR-011 is enforced in the same single visibility function as the secret word
  (feature 002, R4); the screen cannot leak what it never receives.

## R6. Game-screen polling

- **Decision**: Extract the lobby's 2-second polling and error handling into a
  `useRoomPolling()` hook in `frontend/src/state/useRoomPolling.ts`, used by both LobbyPage and
  GamePage. It returns the latest refresh error; a 404 clears the room (feature 001 behaviour).
- **Rationale**: Two screens now need identical polling (FR-010); one hook avoids two copies
  drifting apart.
- **Alternatives considered**: Copying the effect into GamePage (duplicated logic).

## R7. Game screen composition

- **Decision**: Reuse the existing placeholder components, giving them data:
  `GuessForm` gets an `onSubmit(text)` prop and shows refusal messages; `Scoreboard` receives
  participants with scores; `ResultPanel` (titled "Activity") renders the guess history. When
  `status === "ended"` the guess form is disabled and a "Round over" notice is shown; the full
  result view is feature 004.
- **Rationale**: Brownfield discipline — the starter already laid out these slots (gap 9).

## R8. Testing approach

- **Decision**: vitest for every guess rule (trim, empty, case, 100/0 scoring, drawer, repeat
  after correct, not in progress, unknown player, round end with one and two guessers, score
  reset on start) and for history masking; API client test for the guess request. Canvas and
  live sync are checked manually in two tabs.
- **Rationale**: Constitution Principle V; no component-test library (feature 001, R8).
