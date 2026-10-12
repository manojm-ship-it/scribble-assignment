# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribble-lab` (feature folder `specs/004-result-restart`)

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Feature 004 result-restart (Scenario 4 — Result, Restart & Final Validation). Given a round has ended, when the result state is displayed and the host restarts, then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

**Builds on**: feature 001 (host; lobby refresh; host-only start with 2+ players), feature 002
(host is drawer; deterministic word using the room's games-started count; word visible only to
the drawer during the round) and feature 003 (guesses; 100/0 scoring; the round ends when every
guesser is correct; correct-guess text hidden until then).

**Known limitation addressed**: the game screen's "Exit Game" button (feature 001 risk) returns
the player to the lobby, which immediately sends them back to the game while a round is active.

## Clarifications

### Session 2026-10-12

- Q: Can the host restart while a round is still in progress? → A: Yes. During an active round
  the host sees "End game and return to lobby"; it applies exactly the same reset as "Play again"
  on the result. This keeps feature 003's assumption that the host can always end a stuck round.
- Q: What replaces the bouncing "Exit Game" button? → A: It is removed. The host's restart
  controls return everyone to the lobby; a per-player leave is out of scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Everyone sees the round's result (Priority: P1)

When the round ends, every player sees the same result: the secret word, each player's final
score, and the complete guess history including the text of correct guesses.

**Why this priority**: The result is the payoff of the round and is required by the scenario;
until now, guessers never learn the word unless they guessed it.

**Independent Test**: Finish a round in two or three browsers and compare their result screens.

**Acceptance Scenarios**:

1. **Given** a round has just ended, **When** any player's game screen next refreshes,
   **Then** within about 2 seconds it shows a result with "The word was <word>".
2. **Given** the result is shown, **When** a player reads the final scores, **Then** every player
   in the room is listed with their final score, highest first (ties in join order).
3. **Given** the result is shown, **When** a player reads the guess history, **Then** every guess
   of the round is listed in order with its text, and correct guesses are marked.
4. **Given** the result is shown, **When** the drawer and each guesser compare screens, **Then**
   the word, scores and history are identical on all of them.

---

### User Story 2 - The host restarts and everyone returns to the lobby (Priority: P1)

From the result, the host restarts the game. Every player returns to the lobby with the same
players and the same host, all scores back to 0 and no trace of the previous round, ready for
the host to start again.

**Why this priority**: Restart closes the game loop and is required by the scenario.

**Independent Test**: After a finished round, have the host restart; confirm every tab lands in
the lobby with the same players, then start a second game and confirm a clean round.

**Acceptance Scenarios**:

1. **Given** the result is shown, **When** the host views it, **Then** they see a "Play again"
   control; **When** a non-host views it, **Then** they see "Waiting for the host to start a new
   game." and no control.
2. **Given** the result is shown, **When** the host chooses "Play again", **Then** every player is
   back in the lobby within about 2 seconds, with the same players, names and host.
3. **Given** the game has been restarted, **When** anyone inspects the room, **Then** every score
   is 0, the guess history is empty, and there is no drawer and no secret word.
4. **Given** the game has been restarted, **When** the host starts again with 2+ players,
   **Then** a new round begins with the next word from the word rule (the games-started count has
   increased), and play works as in features 002–003.
5. **Given** a non-host, **When** they attempt to restart by any means, **Then** it is refused
   with "Only the host can restart the game." and nothing changes.
6. **Given** a room in the lobby, **When** anyone attempts to restart, **Then** it is refused with
   "The game has not started yet."
7. **Given** an active round that no one can finish, **When** the host chooses "End game and
   return to lobby", **Then** the same reset as "Play again" happens and everyone returns to the
   lobby.

---

### User Story 3 - Leaving the game screen no longer bounces (Priority: P3)

The game screen's exit control no longer sends players into a loop between the lobby and the
game.

**Why this priority**: A known defect from feature 001; minor, but visible to every player.

**Independent Test**: During a round and on the result screen, use the exit control and confirm
the player does not bounce back.

**Acceptance Scenarios**:

1. **Given** an active round or a result, **When** a player views the game screen, **Then** there
   is no "Exit Game" control, and no control sends them to a screen that immediately sends them
   back.

### Edge Cases

- Restarting while a round is still in progress is allowed for the host (Clarifications); the
  previous round's guesses and scores are discarded without a result being shown.
- A player whose round ended while the game service was briefly unreachable sees the result on
  the next successful refresh.
- Two restart requests arriving together: the first succeeds; the second is refused with
  "The game has not started yet." because the room is already back in the lobby.
- Late joins stay refused while the room is playing or showing the result (feature 001
  clarification); after a restart the room is in the lobby and joining works again.
- A room left on the result screen with nobody refreshing is removed after 30 minutes like any
  inactive room (feature 001).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a round has ended, every player's view of the room MUST include the secret
  word.
- **FR-002**: The result MUST show "The word was <word>", every player's final score ordered
  highest first (ties in join order), and the complete guess history in order with the text of
  every guess and correct guesses marked.
- **FR-003**: Every player's game screen MUST show the result within about 2 seconds of the round
  ending, without any action.
- **FR-004**: Only the host MUST be able to restart; others are refused with "Only the host can
  restart the game."
- **FR-005**: A restart MUST be accepted from an active round or an ended round, and refused
  with "The game has not started yet." when the room is in the lobby.
- **FR-006**: A restart MUST return the room to the lobby keeping every participant (same
  identity, name and join order) and the same host, set every score to 0, clear the guess
  history, and clear the drawer and secret word.
- **FR-007**: After a restart, every player's screen MUST return to the lobby within about 2
  seconds, and the host MUST be able to start a new game under the feature 001 rules.
- **FR-008**: The games-started count MUST be kept across a restart, so the next game's word
  follows the feature 002 rule with the increased count.
- **FR-009**: The result MUST show a "Play again" control to the host only; other players see
  "Waiting for the host to start a new game." During an active round the host MUST have an
  "End game and return to lobby" control with the same effect.
- **FR-010**: The game screen's "Exit Game" control MUST be removed; no control on the game
  screen may send a player to a screen that immediately sends them back.

### Key Entities

- **Result**: the view of a room whose round has ended — the revealed word, final scores and the
  full guess history. Not stored separately; it is the room in its ended state.
- **Room** (unchanged fields, new transition): ended → lobby on restart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of finished rounds tested, every player's screen shows the same word,
  scores and full history within 3 seconds of the round ending.
- **SC-002**: After a restart, 100% of players are back in the lobby within 3 seconds, with the
  participant list identical to before the round.
- **SC-003**: After a restart, 0 traces of the previous round remain (scores 0, no guesses, no
  drawer, no word) in 100% of tested rooms.
- **SC-004**: 100% of restart attempts by non-hosts, or from the lobby, are refused with their
  message.
- **SC-005**: A full cycle — create, join, play, result, restart, play again — completes in two
  browsers without reloading any page.

## Assumptions

- One round per game; "Play again" starts a fresh game, not a second round of the same game
  (constitution, Principle III).
- No persistent leaderboard: scores from earlier games are discarded on restart.
- No leave-room or kick feature; players leave by closing their tab.
- The result is shown on the game screen rather than a separate screen.
