# Research: Room Setup & Lobby

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`. The decisions below settle
the design questions the spec leaves to planning. All of them reuse the starter's existing
stack (Express, Zod, React, vitest); no dependencies are added (constitution, Principle I).

## R1. Where room-code validation happens

- **Decision**: Validate in the Zod params schema (`roomCodeParamsSchema`): trim, require
  non-empty ("Enter a room code."), require exactly 4 letters or digits ("Room codes are 4
  letters or numbers."), then upper-case. The join form also refuses an empty code before
  sending, because an empty path segment never reaches the `/:code/join` route.
- **Rationale**: One schema enforces FR-005 and FR-006 for every room route; the client check
  covers the one case the server cannot see.
- **Alternatives considered**: Validating inside each route handler (duplicated logic);
  validating only in the UI (violates server-authoritative rule, Principle II).

## R2. Showing Zod messages to players

- **Decision**: The central `errorHandler` returns the first Zod issue's message instead of the
  fixed "Invalid request payload".
- **Rationale**: FR-015 requires messages that can be shown directly to players. Schemas
  without custom messages still produce a readable default.
- **Alternatives considered**: Catching `ZodError` in each route (scatters error handling,
  against Principle IV).

## R3. How services report refusals

- **Decision**: Service functions throw the existing `HttpError` (status + message) for
  refusals: 404 room not found, 403 not host, 409 already started, 400 too few players.
- **Rationale**: Keeps routes thin and every rule in `services/roomStore.ts`, where it is unit
  tested; the centralized error handler already renders `HttpError`.
- **Alternatives considered**: Returning result objects and mapping them in routes (more code
  for the same outcome); moving `HttpError` to a new module (an unrelated refactor).

## R4. Starting the game

- **Decision**: New endpoint `POST /rooms/:code/start` with body `{ participantId }`. The
  service checks, in order: room exists → requester is host → room still in lobby → at least
  2 participants; then sets `status` to `"playing"`.
- **Rationale**: Without authentication, the `participantId` issued at create/join is the only
  identity (constitution, Technical Constraints). Checking host first means a non-host never
  learns more than "Only the host can start the game."
- **Alternatives considered**: Passing `participantId` as a query string (inconsistent with
  other write endpoints, which take a JSON body).

## R5. Moving all players to the game screen

- **Decision**: The lobby polls `GET /rooms/:code` every 2000 ms; when a snapshot arrives with
  `status: "playing"`, the page navigates to `/game`. The host's own start response updates the
  store immediately, so the host moves without waiting for a poll.
- **Rationale**: Satisfies FR-007/FR-011 with HTTP polling only (Technical Constraints).
- **Alternatives considered**: Any push mechanism (forbidden); a separate status endpoint
  (duplicates the snapshot).

## R6. Inactive room cleanup

- **Decision**: Each room stores `lastActiveAt` (epoch ms), updated by every create, join,
  fetch and start. An exported `removeInactiveRooms(now)` deletes rooms idle for more than
  30 minutes; `server.ts` calls it every 60 seconds with an unref'd timer.
- **Rationale**: Meets FR-014 and the AGENTS.md footprint rule. Taking `now` as a parameter
  makes the 30-minute rule testable without fake timers.
- **Alternatives considered**: Checking expiry lazily on access (never frees rooms nobody
  touches again); a timer per room (more state for the same result).

## R7. Detecting a room that no longer exists

- **Decision**: `api.ts` throws an `ApiError` that carries the HTTP status. The lobby treats a
  404 while polling as "This room is no longer available.", clears the room from the store and
  returns to the start screen. Other failures keep the last snapshot and show the message.
- **Rationale**: FR-008 and US3.3 need to tell "gone" apart from "temporarily unreachable";
  matching on message text would be brittle.
- **Alternatives considered**: String-matching error messages (breaks if wording changes).

## R8. Testing approach

- **Decision**: vitest unit tests for every rule in `roomStore.ts` and the code schema; a
  frontend `api.test.ts` case for the default base URL and the start request. Lobby polling
  and navigation are validated manually with two browsers (quickstart.md).
- **Rationale**: Constitution Principle V. A component test for polling would need
  `@testing-library/react`, which is a new dependency not justified for one screen.
- **Alternatives considered**: Adding React Testing Library (rejected, Principle I).
