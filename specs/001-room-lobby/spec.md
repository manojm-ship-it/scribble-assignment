# Feature Specification: Room Setup & Lobby

**Feature Branch**: `scribble-lab` (feature folder `specs/001-room-lobby`)

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Feature 001 room-lobby (Scenario 1 — Room Setup & Lobby). Given a player wants to host or join a drawing game, when they create or join a room via a unique code, then: the creator is automatically the host; invalid or empty room codes are rejected with clear feedback; rooms are fully isolated from each other; the lobby refreshes automatically via polling about every 2 seconds; and only the host can start the game, and only once at least 2 players are present."

**Discovery gaps addressed**: 1 (app cannot reach the game service by default), 2 (no host),
3 (lobby does not refresh on its own), 4 (start is ungated), 6 (room codes not validated),
10 (inactive rooms never removed). See `docs/discovery.md`.

## Clarifications

### Session 2026-10-12

- Q: Can a player join a room after its game has started? → A: No. The join is refused with
  "This game has already started."; the player can join again after a restart (feature 004).
- Q: How long can a room go without activity before it is removed? → A: 30 minutes. Any
  request for the room counts as activity, including automatic refreshes.
- Q: Can two players in the same room have the same name? → A: Yes, duplicates are allowed.
  Each player's own entry is marked "(you)" and the host is marked, so views stay unambiguous.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host creates a room (Priority: P1)

A player opens the game, creates a room, and lands in the lobby. They are clearly shown as the
host and see a short room code they can share with friends.

**Why this priority**: Nothing else in the game can happen without a room and a host. This is
the minimum slice that proves the app works end to end on a local setup.

**Independent Test**: Start the app with default local settings, create a room, and confirm the
lobby shows the room code and marks the creator as host.

**Acceptance Scenarios**:

1. **Given** the app is running with its default local settings, **When** a player creates a
   room, **Then** they land in the lobby, see a 4-character room code, and are labelled as host.
2. **Given** a room has just been created, **When** anyone views its lobby, **Then** exactly one
   participant (the creator) is marked as host.
3. **Given** several rooms are created, **When** their codes are compared, **Then** every active
   room has a different code.

---

### User Story 2 - Player joins a room by code (Priority: P1)

A second player enters the room code they were given and joins the same lobby. Mistyped, empty
or unknown codes are refused with a message that tells them what went wrong.

**Why this priority**: A drawing game needs at least two players; joining is the other half of
the minimum flow.

**Independent Test**: With one room open, join it from a second browser using the code typed in
lower case, then try an empty code, a malformed code and a well-formed unknown code.

**Acceptance Scenarios**:

1. **Given** a room exists in the lobby state, **When** a player enters its code (in any letter
   case), **Then** they join that room and land in its lobby as a non-host player.
2. **Given** the join form, **When** the player submits an empty or whitespace-only code,
   **Then** the join is refused with the message "Enter a room code." and they stay on the form.
3. **Given** the join form, **When** the player submits a code that is not 4 letters or digits
   (e.g. `AB`, `ABCDE`, `AB!D`), **Then** the join is refused with the message
   "Room codes are 4 letters or numbers." and they stay on the form.
4. **Given** no room with that code exists, **When** the player submits a well-formed code,
   **Then** the join is refused with the message "Room not found. Check the code and try again."
5. **Given** a room whose game has already started, **When** a player tries to join it,
   **Then** the join is refused with the message "This game has already started."

---

### User Story 3 - Lobby updates automatically (Priority: P2)

Everyone in a lobby sees the participant list update on its own as people join, without
pressing any button.

**Why this priority**: Without it, the host cannot tell when enough players are present, and
other players cannot tell when the game starts.

**Independent Test**: Open a lobby in browser A, join from browser B, and time how long until B
appears in A without any clicks.

**Acceptance Scenarios**:

1. **Given** player A is in a lobby, **When** player B joins the same room, **Then** B appears in
   A's participant list within about 2 seconds, with no action from A.
2. **Given** a lobby is open, **When** the connection to the game service briefly fails,
   **Then** the lobby keeps showing the last known participants and a readable error, does not
   crash, and recovers on the next successful refresh.
3. **Given** a lobby is open, **When** the room no longer exists, **Then** the player sees
   "This room is no longer available." and is returned to the start screen.

---

### User Story 4 - Host starts the game (Priority: P1)

When at least two players are present, the host starts the game and every player in the room is
taken to the game screen. Nobody else can start it, and it cannot start with fewer than two.

**Why this priority**: It is the gate into every later feature (drawer, guessing, results).

**Independent Test**: In a room with one player, confirm start is not possible; add a second
player, confirm only the host can start, then start and confirm both players reach the game
screen.

**Acceptance Scenarios**:

1. **Given** a lobby with only the host, **When** the host views the lobby, **Then** the start
   control is disabled and shows "Waiting for at least 2 players."
2. **Given** a lobby with 2 or more players, **When** a non-host views the lobby, **Then** no
   start control is shown; they see "Waiting for the host to start the game."
3. **Given** a lobby with 2 or more players, **When** the host starts the game, **Then** the
   room leaves the lobby state and every player in that room reaches the game screen within
   about 2 seconds.
4. **Given** a non-host player, **When** they attempt to start the game by any means (including
   calling the service directly), **Then** the attempt is refused with
   "Only the host can start the game." and the room stays in the lobby.
5. **Given** a room with fewer than 2 players, **When** the host attempts to start by any means,
   **Then** the attempt is refused with "At least 2 players are needed to start." and the room
   stays in the lobby.

---

### User Story 5 - Rooms are isolated and cleaned up (Priority: P2)

Several groups can play at the same time without affecting each other, and rooms nobody is
using any more are removed.

**Why this priority**: Isolation is a grading criterion and a correctness guarantee; cleanup
keeps the in-memory footprint small, as the constitution requires.

**Independent Test**: Run two rooms side by side, join and start one, and confirm the other's
participants and state are unchanged. Separately, leave a room untouched past the inactivity
limit and confirm it can no longer be joined.

**Acceptance Scenarios**:

1. **Given** rooms R1 and R2, **When** a player joins R1 or R1's host starts the game, **Then**
   R2's participant list, host and state are unchanged.
2. **Given** a room that has received no requests for 30 minutes, **When** cleanup runs,
   **Then** the room is removed and joining it returns "Room not found. Check the code and try
   again."
3. **Given** a room whose lobby is still open in at least one browser, **When** 30 minutes pass,
   **Then** the room is not removed, because the automatic refresh keeps it active.

### Edge Cases

- Room codes are case-insensitive: `abcd` and `ABCD` refer to the same room.
- Leading and trailing spaces around a typed code are ignored (`" abcd "` joins `ABCD`).
- Starting a game that has already started is refused with "This game has already started."
- Two players joining at the same moment are both added; neither join is lost.
- A start request that names a player who is not in the room is refused as not the host.
- A refresh request for a room that exists but from a player not in it still returns the room
  without exposing any other room's data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST work against the game service using its default local settings,
  without the player or developer setting any extra configuration.
- **FR-002**: Creating a room MUST generate a 4-character code, made of letters and digits, that
  is unique among all active rooms.
- **FR-003**: The player who creates a room MUST be recorded as its host; each room MUST have
  exactly one host, and the host MUST NOT change while the room exists.
- **FR-004**: The lobby MUST show every participant's name in join order, visibly mark which one
  is host, and mark the viewing player's own entry as "(you)". Duplicate names are allowed.
- **FR-005**: Room codes MUST be matched case-insensitively and with surrounding spaces ignored.
- **FR-006**: The system MUST refuse to join with a clear message when the code is empty,
  malformed (not exactly 4 letters or digits), unknown, or belongs to a room that has already
  started (messages as in User Story 2).
- **FR-007**: The lobby MUST refresh its participant list and room state automatically about
  every 2 seconds while it is on screen, and MUST stop refreshing when the player leaves it.
- **FR-008**: The lobby MUST NOT crash when a refresh fails; it MUST keep the last known state,
  show a readable error, and recover on the next successful refresh.
- **FR-009**: Only the host MUST be able to start the game; the system MUST refuse start
  attempts from anyone else, regardless of what the screen shows.
- **FR-010**: The system MUST refuse to start a game with fewer than 2 players in the room.
- **FR-011**: Starting the game MUST move the room out of the lobby state, and every player in
  that room MUST be taken to the game screen by their next automatic refresh.
- **FR-012**: The start control MUST be shown only to the host, and MUST be disabled with an
  explanation while fewer than 2 players are present.
- **FR-013**: Actions in one room MUST NOT read or change any other room's participants, host or
  state.
- **FR-014**: A room that has received no requests for 30 minutes MUST be removed from memory.
- **FR-015**: Every refusal MUST return a human-readable message suitable for showing directly
  to the player.

### Key Entities

- **Room**: a game session identified by its 4-character code. Has a host, a list of
  participants in join order, a state (`lobby` or `playing` for this feature), and the time of
  its last activity.
- **Participant**: a player in exactly one room, identified by the id issued when they created or
  joined it, with a display name.
- **Host**: the participant who created the room; the only one allowed to start the game.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a fresh local setup with default settings, a player can create a room and reach
  the lobby on the first attempt, with no configuration changes.
- **SC-002**: A player who joins appears in every other lobby in the same room within 3 seconds
  in 10 out of 10 trials, with no clicks.
- **SC-003**: 100% of tested invalid joins (empty, malformed, unknown, already started) are
  refused with the specific message for that case, and none crash the app.
- **SC-004**: 100% of start attempts by non-hosts, or with fewer than 2 players, are refused,
  whether made from the screen or directly against the service.
- **SC-005**: After the host starts the game, every player in the room reaches the game screen
  within 3 seconds.
- **SC-006**: With two rooms active at once, no action in one room changes anything observable in
  the other.
- **SC-007**: A room left without requests for more than 30 minutes can no longer be joined.

## Assumptions

- Players are identified only by the id given when they create or join a room; there are no
  accounts or sign-in (constitution, Technical Constraints).
- Player name validation (trimming, rejecting empty names) is handled in feature 002; this
  feature keeps the starter's current naming behaviour.
- Starting the game here only changes the room state and routes players to the game screen;
  drawer assignment and the secret word are feature 002.
- There is no maximum number of players per room, and names do not need to be unique.
- There is no "leave room" action; a player leaving the page simply stops refreshing. If the host
  leaves, the room remains until it becomes inactive.
- Inactivity is measured from the last request of any kind for that room; automatic lobby
  refreshes count as activity. The 30-minute limit was confirmed in Clarifications.
- Refreshing the browser tab loses the player's id; they must create or join again.
