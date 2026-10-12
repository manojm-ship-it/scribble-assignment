# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribble-lab` (feature folder `specs/003-gameplay`)

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Feature 003 gameplay (Scenario 3 — Gameplay Interaction). Given a round is active with a drawer and guessers (all scores start at 0), when the drawer draws on and clears the canvas and guessers submit their guesses, then: the drawing is visible on the drawer's screen; guesses are trimmed, compared case-insensitively with the secret word, and empty guesses are rejected; the guess history is synced to all players via polling (about every 2 seconds); a correct guess scores 100 and an incorrect guess adds 0."

**Builds on**: feature 001 (rooms, host-only start, 2-second lobby refresh) and feature 002
(host is the drawer; deterministic secret word visible only to the drawer).

**Discovery gaps addressed**: 7 (no guesses or scores in the room), 9 (the game screen is
placeholder-only: guesses go nowhere, scoreboard and activity panel are static, no canvas).
See `docs/discovery.md`.

## Clarifications

### Session 2026-10-12

- Q: What ends the round? → A: The round ends as soon as every guesser (every participant except
  the drawer) has guessed the word. The room then leaves the active round, guessing closes, and
  the result display and restart follow in feature 004.
- Q: Do guessers see the drawing? → A: No. The canvas lives only on the drawer's screen and no
  strokes are sent anywhere; guessers' canvas area reads "<drawer name> is drawing". This matches
  Scenario 3 ("visible on the drawer's screen") and discovery assumption 5.
- Q: Should correct guesses' text be hidden in the history? → A: Yes, while the round is active
  the text of correct guesses is withheld from every player's view ("<name> guessed the word!").
  Once the round has ended, the full history including that text may be shown (feature 004).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer draws and clears the canvas (Priority: P1)

The drawer sketches the secret word on a canvas with the mouse or a finger, and can wipe the
canvas clean to start over.

**Why this priority**: Drawing is the drawer's whole job in the round; without it the game has
nothing to guess from.

**Independent Test**: As the drawer, draw several strokes, confirm they appear where the pointer
moved, press Clear, and confirm the canvas is blank.

**Acceptance Scenarios**:

1. **Given** an active round, **When** the drawer presses and drags on the canvas, **Then** a
   line follows the pointer on the drawer's screen.
2. **Given** the drawer has drawn strokes, **When** they press "Clear canvas", **Then** the
   canvas becomes blank and they can draw again.
3. **Given** an active round, **When** a guesser views the game screen, **Then** they cannot draw
   or clear, and the canvas area reads "<drawer name> is drawing".

---

### User Story 2 - Guessers submit guesses that are checked fairly (Priority: P1)

A guesser types a guess and submits it. Surrounding spaces and letter case do not matter; an
empty guess is refused with a message. A correct guess earns 100 points; a wrong guess earns
nothing.

**Why this priority**: Guessing and scoring are the core interaction of the scenario.

**Independent Test**: Start a round whose word is known (feature 002 rule); as a guesser submit
an empty guess, a wrong guess, and the word in different case with extra spaces; check messages
and score after each.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits an empty or whitespace-only guess,
   **Then** it is refused with "Enter a guess." and nothing is recorded.
2. **Given** the word is `pizza`, **When** a guesser submits `"burger"`, **Then** the guess is
   recorded as incorrect and their score stays the same.
3. **Given** the word is `pizza`, **When** a guesser submits `"  PiZZa "`, **Then** the guess is
   recorded as correct and their score increases by exactly 100.
4. **Given** an active round, **When** the drawer tries to submit a guess by any means, **Then**
   it is refused with "The drawer cannot guess."
5. **Given** a guesser has already guessed correctly, **When** they submit another guess,
   **Then** it is refused with "You already guessed the word."
6. **Given** a room that is not in an active round, **When** anyone submits a guess, **Then** it
   is refused with "The round is not in progress."
7. **Given** a round with guessers Ben and Cara, **When** Ben guesses correctly, **Then** the
   round continues; **When** Cara then guesses correctly, **Then** the round ends and further
   guesses are refused with "The round is not in progress."

---

### User Story 3 - Everyone sees the guess history and scores (Priority: P1)

Every player's game screen shows the list of guesses made so far and each player's score, and
updates on its own about every 2 seconds.

**Why this priority**: Players need to see what has been tried and who is winning; the
scenario requires the history to be synced by polling.

**Independent Test**: With two guessers (or a guesser plus the drawer watching), submit guesses
in one tab and time how long they take to appear in the others without any clicks.

**Acceptance Scenarios**:

1. **Given** player B submits a guess, **When** player A's screen next refreshes, **Then** the
   guess appears in A's history within about 2 seconds, showing B's name, in submission order.
2. **Given** an incorrect guess, **When** it appears in the history, **Then** its text is shown
   (e.g. "Ben: burger").
3. **Given** a correct guess during an active round, **When** it appears in the history,
   **Then** its text is **not** shown; the entry reads "Ben guessed the word!" so the word is not
   revealed to other guessers.
4. **Given** a round has started, **When** any player views the scoreboard, **Then** it lists
   every player with their current score, starting at 0, and updates within about 2 seconds of a
   change.

### Edge Cases

- Internal spaces in a guess are kept: `"pi zza"` is not `pizza`.
- A guess that differs only in case or surrounding spaces from the word is correct.
- Two guessers submitting at the same moment both have their guesses recorded, in the order the
  game service received them.
- Repeating the same wrong guess is allowed and recorded each time.
- A guess sent with a player id that is not in the room is refused with "You are not a player in
  this room."
- Refreshing the browser loses the player's identity (feature 001); they can no longer guess.
- If the game service is briefly unreachable, the game screen keeps the last history and scores
  and shows the feature 001 connection message; it recovers on the next refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The drawer's game screen MUST provide a canvas on which the drawer can draw
  freehand lines with mouse or touch.
- **FR-002**: The drawer MUST be able to clear the canvas completely with one action.
- **FR-003**: Guessers MUST NOT be able to draw on or clear the canvas.
- **FR-004**: Guesses MUST have leading and trailing whitespace removed before checking and
  recording.
- **FR-005**: A guess that is empty after trimming MUST be refused with "Enter a guess." and
  MUST NOT be recorded.
- **FR-006**: A guess MUST be correct exactly when it equals the secret word ignoring letter
  case.
- **FR-007**: All scores MUST be 0 when a round starts; a correct guess MUST add exactly 100 to
  the guesser's score, and an incorrect guess MUST add 0.
- **FR-008**: The game service MUST refuse guesses from the drawer ("The drawer cannot guess."),
  from a guesser who already guessed correctly ("You already guessed the word."), and when no
  round is in progress ("The round is not in progress.").
- **FR-009**: Every accepted guess MUST be recorded in the room's guess history with the
  guesser, the trimmed text, whether it was correct, and its order.
- **FR-010**: Every player's game screen MUST refresh the guess history and scores automatically
  about every 2 seconds while it is open.
- **FR-011**: During an active round, the history sent to players MUST NOT contain the text of
  correct guesses (shown as "<name> guessed the word!"); incorrect guesses show their text.
  After the round ends, correct-guess text may be included (feature 004).
- **FR-012**: The scoreboard MUST list every player in the room with their current score.
- **FR-013**: Guess checking and scoring MUST be done by the game service, never by the screen.
- **FR-014**: When every guesser has guessed correctly, the round MUST end: the room leaves the
  active round and no further guesses are accepted. Every player's screen MUST reflect that the
  round has ended within about 2 seconds (the result display itself is feature 004).

### Key Entities

- **Guess**: one submission in a round — who made it, the trimmed text, whether it was correct,
  and its position in the history.
- **Score**: each participant's points for the current round; 0 at round start.
- **Room** (extended): holds the round's guess history and every participant's score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw and clear the canvas in 100% of tried attempts, with strokes
  appearing under the pointer as it moves.
- **SC-002**: 100% of tested empty guesses are refused with "Enter a guess."; 100% of tested
  case and spacing variants of the word are scored correct.
- **SC-003**: A correct guess changes the guesser's score by exactly 100 and a wrong guess by 0,
  in 10 out of 10 trials.
- **SC-004**: A guess appears on every other player's screen within 3 seconds, with no clicks,
  in 10 out of 10 trials.
- **SC-005**: In 0 of all tested history views during an active round does a correct guess's
  text appear.

## Assumptions

- Single round, no timers, speed bonuses or drawer bonuses (constitution, Principle III).
- The result screen and restart are feature 004; this feature only records guesses and scores.
- Guessers can make unlimited wrong guesses until they guess correctly.
- The canvas is visible only on the drawer's screen; strokes are not sent to other players
  (confirmed in Clarifications).
- If a guesser never finds the word, the round stays open; the host's restart (feature 004)
  is the way out.
