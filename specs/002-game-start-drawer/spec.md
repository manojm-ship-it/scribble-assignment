# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `scribble-lab` (feature folder `specs/002-game-start-drawer`)

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Feature 002 game-start-drawer (Scenario 2 — Game Start & Drawer Flow). Given a game is starting and player names are trimmed (empty or whitespace-only names rejected with a message), when the first round begins, then the host (the first player) becomes the clearly-identified drawer, and the secret word — deterministically selected from the starter list (rocket, pizza, castle, guitar, sunflower) — is visible only to the drawer."

**Builds on**: feature 001 (host recorded at creation; host-only start moves the room from
lobby to playing; lobby refresh takes every player to the game screen).

**Discovery gaps addressed**: 5 (names not validated; blank names silently become "Player"),
7 (no drawer or secret word), 8 (room views ignore who is asking; the full word list is sent to
every player). See `docs/discovery.md`.

## Clarifications

### Session 2026-10-12

- Q: What fixed rule picks the secret word? → A: index = (sum of the character codes of the
  room code + number of games already started in that room) mod 5, applied to the starter list
  in order [rocket, pizza, castle, guitar, sunflower]. The first game in a room uses a count of
  0; each restart (feature 004) increases it by one, so a restarted room moves to the next word.
  Example: room `ABCD` (65+66+67+68 = 266), first game → 266 mod 5 = 1 → `pizza`.
- Q: Should players stop receiving the candidate word list? → A: Yes. Room views no longer
  include the starter word list or the unused role list; no screen displays either.
- Q: Should player names have a maximum length? → A: Yes, 20 characters after trimming. Longer
  names are refused with "Names can be at most 20 characters."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Players enter a valid name (Priority: P1)

When creating or joining a room, a player types their name. Extra spaces around it are removed,
and a name that is empty or only spaces is refused with a message, so every player in a room has
a visible name.

**Why this priority**: The drawer, the scoreboard and the guess history all identify players by
name; a blank or placeholder name makes the game confusing.

**Independent Test**: Try to create and to join a room with an empty name and with a name of
only spaces; then create a room as `"  Ann  "` and confirm the lobby shows `Ann`.

**Acceptance Scenarios**:

1. **Given** the create-room form, **When** the player submits an empty or whitespace-only
   name, **Then** no room is created and the message "Enter your name." is shown.
2. **Given** the join-room form with a valid room code, **When** the player submits an empty or
   whitespace-only name, **Then** they do not join and the message "Enter your name." is shown.
3. **Given** a player enters `"  Ann  "`, **When** they create or join a room, **Then** every
   player sees the name as `Ann`.
4. **Given** a name of 21 or more characters (after trimming), **When** the player creates or
   joins a room, **Then** it is refused with "Names can be at most 20 characters."; a name of
   exactly 20 characters is accepted.
5. **Given** any client bypasses the forms and sends a blank name directly to the game service,
   **When** the request is processed, **Then** it is refused with "Enter your name." and nothing
   changes.

---

### User Story 2 - The host becomes the clearly identified drawer (Priority: P1)

When the host starts the game, the host becomes the drawer for the round. Every player can see
who is drawing, and each player can tell whether they are drawing or guessing.

**Why this priority**: Gameplay (feature 003) depends on knowing who draws and who guesses.

**Independent Test**: Start a game with two players and compare both game screens.

**Acceptance Scenarios**:

1. **Given** a lobby with host Ann and player Ben, **When** Ann starts the game, **Then** Ann is
   recorded as the drawer for the round.
2. **Given** the round has started, **When** any player views the game screen, **Then** it shows
   "Ann is drawing" (the drawer's name).
3. **Given** the round has started, **When** Ann views the game screen, **Then** it shows
   "You are the drawer"; **When** Ben views it, **Then** it shows "You are guessing".
4. **Given** a room still in the lobby, **When** anyone views it, **Then** no drawer is shown.

---

### User Story 3 - Only the drawer sees the secret word (Priority: P1)

When the round starts, a secret word is chosen. The drawer sees it on their game screen;
guessers never receive it, not even by asking the game service directly.

**Why this priority**: If guessers can see the word, there is no game. This is the core
fairness rule of the scenario.

**Independent Test**: Start a game in two browsers; confirm the drawer sees the word and the
guesser does not. Then request the room directly as the guesser, as an unknown player, and with
no player id, and confirm none of the responses contain the word.

**Acceptance Scenarios**:

1. **Given** the round has started, **When** the drawer views the game screen, **Then** it shows
   "Your word: <word>".
2. **Given** the round has started, **When** a guesser views the game screen, **Then** no secret
   word is shown and the screen says the word is hidden.
3. **Given** the round has started, **When** the room is requested as a guesser, as a player id
   that is not in the room, or with no player id, **Then** the response does not contain the
   secret word.
4. **Given** a room in the lobby, **When** it is requested by anyone, including the host,
   **Then** the response contains no secret word.

---

### User Story 4 - The secret word is chosen deterministically (Priority: P2)

The word is picked from the five starter words by a fixed rule, so the same situation always
produces the same word and the choice can be tested and explained.

**Why this priority**: Required by the scenario and by the constitution's deterministic-rules
principle; it does not change what players see in a single game.

**Independent Test**: Apply the rule to known inputs and confirm the expected words; start the
same situation twice and confirm the same word both times.

**Acceptance Scenarios**:

1. **Given** room `ABCD` starting its first game, **When** the word is chosen, **Then** it is
   `pizza` (266 mod 5 = 1).
2. **Given** two starts with identical inputs to the rule, **When** words are chosen, **Then**
   they are the same word.
3. **Given** any start, **When** a word is chosen, **Then** it is one of rocket, pizza, castle,
   guitar or sunflower.

### Edge Cases

- A name such as `"  "` or a tab-only name is refused like an empty name.
- Internal spaces are kept: `"Ann  Lee"` stays `"Ann  Lee"`; only leading and trailing spaces
  are removed.
- When joining with both an invalid room code and a blank name, the room-code message is shown
  first; after fixing the code, the name message is shown.
- A player who refreshes their browser tab loses their identity (feature 001 assumption) and is
  treated as an unknown viewer: they do not see the word.
- The drawer is the host even if the host's name is the same as another player's name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Player names MUST have leading and trailing whitespace removed before they are
  stored or shown, on both create and join.
- **FR-002**: A name that is empty after trimming MUST be refused with "Enter your name.", and
  no room may be created or joined.
- **FR-003**: A name longer than 20 characters after trimming MUST be refused with
  "Names can be at most 20 characters."
- **FR-003a**: Name rules (FR-001 to FR-003) MUST be enforced by the game service, regardless of
  what the screen allows.
- **FR-004**: When a game starts, the host MUST be recorded as the drawer; the drawer MUST NOT
  change for the rest of the round.
- **FR-005**: Every player's game screen MUST show the drawer's name ("<name> is drawing") and
  whether the viewer is drawing ("You are the drawer") or guessing ("You are guessing").
- **FR-006**: When a game starts, the secret word MUST be the starter word at index
  (sum of the room code's character codes + games already started in the room) mod 5, using the
  order rocket, pizza, castle, guitar, sunflower.
- **FR-007**: The secret word MUST be included only in the view sent to the drawer. Views for
  any other participant, for an unknown participant id, or with no participant id MUST NOT
  contain it. *Amended by feature 004 (`specs/004-result-restart/spec.md`, FR-001; research R1):
  this rule holds while the round is active; once the round has ended, the word is revealed to
  every player as part of the result.*
- **FR-008**: A room in the lobby MUST have no drawer and no secret word.
- **FR-009**: Views sent to players MUST NOT include the list of candidate words (or the unused
  list of roles).

### Key Entities

- **Room** (extended): gains a **drawer** (the participant drawing this round; empty in the
  lobby), a **secret word** (empty in the lobby; set at start) and a **games-started count**
  (0 for a new room; used by the word rule).
- **Room view**: what one player receives about a room. It depends on who is asking: the secret
  word is present only when the viewer is the drawer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tested blank or whitespace-only names are refused with "Enter your name.",
  on both create and join, from the screen and directly against the game service.
- **SC-001a**: 100% of tested names over 20 characters are refused with "Names can be at most
  20 characters.", and 100% of names of exactly 20 characters are accepted.
- **SC-002**: Names entered with surrounding spaces appear without them to every player in 100%
  of tested cases.
- **SC-003**: In a two-player game, the drawer sees their word within 3 seconds of starting, and
  both players can name the drawer from their screen alone.
- **SC-004**: In 0 of all tested guesser, unknown-viewer and anonymous room views does the secret
  word appear.
- **SC-005**: Repeating a start with identical rule inputs yields the same word in 10 out of 10
  trials.

## Assumptions

- Single round per start (constitution, Principle III); drawer rotation is out of scope.
- The starter word list is fixed; no random or custom word packs.
- Drawing, guessing and scoring are feature 003; results and restart are feature 004.
- Identity is the participant id from create/join (feature 001); there are no accounts.
- Room-code validation from feature 001 is unchanged.
