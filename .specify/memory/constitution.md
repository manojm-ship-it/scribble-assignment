# Scribble Constitution

Scribble is a brownfield lab: a multiplayer drawing and guessing game built on an existing
starter (Express + TypeScript + Zod backend, React 18 + React Router v6 + Vite frontend).
This constitution governs every spec, plan, task, and code change made in this repository.

## Core Principles

### I. Brownfield Discipline

- Every change MUST start from inspection of the existing starter code; discovery notes MUST
  list the relevant files before a feature is specified.
- The starter MUST be extended, not rewritten. Existing structure (`backend/src/api`,
  `backend/src/services`, `backend/src/models`, `frontend/src/pages`, `frontend/src/state`,
  `frontend/src/services`) MUST be reused for new code.
- Unrelated refactors are forbidden. A change that is not required by a spec requirement
  MUST NOT be included in a feature commit.
- New top-level dependencies, state-management libraries, or routing libraries MUST NOT be
  added. Any other dependency requires a written justification in the feature's `plan.md`.

Rationale: the lab assesses the ability to evolve an existing codebase with traceable,
reviewable changes, not to replace it.

### II. Server-Authoritative, Deterministic Game Rules

The backend is the single source of truth for room and round state. The frontend renders
snapshots and MUST NOT decide game outcomes. The following rules are non-negotiable:

- The player who creates a room is its host.
- Only the host may start or restart a game; starting requires at least 2 players.
- The host is the drawer for the round.
- The secret word is selected deterministically from the starter word list
  (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`); the same inputs MUST yield the same word.
- The secret word MUST be visible only to the drawer until the result state; room snapshots
  for any other participant MUST omit it.
- Player names and guesses are trimmed; empty or whitespace-only values are rejected with a
  clear message.
- Guesses are compared case-insensitively. A correct guess scores 100; an incorrect guess
  scores 0. All scores start at 0.
- Rooms are fully isolated: no action in one room may read or mutate another room's state.
- Permission checks (host-only, drawer-only, minimum players) MUST be enforced on the server,
  not only hidden in the UI.

Rationale: deterministic, server-enforced rules make behaviour testable and keep every
player's view consistent under polling.

### III. Strict Scope Boundaries

The game supports exactly one round per start. The following MUST NOT be built, specified,
planned, or tasked:

- multiple rounds, drawer rotation, timers, countdowns, speed bonuses, or drawer bonuses
- custom or random word packs
- spectator mode; moderation such as kick or mute
- room passwords or invite links
- deployment, hosting, CI, or Docker work

Rationale: out-of-scope work does not improve the outcome and causes drift between the spec,
plan, tasks, and implementation.

### IV. Typed, Validated, Layered Code

- All code is TypeScript with ES modules. `any` MUST NOT be used; use `unknown` and narrow.
- Every request payload, route parameter, and query string MUST be validated with Zod on
  the backend.
- Route handlers in `backend/src/api` stay thin; business logic lives in
  `backend/src/services`; entity types live in `backend/src/models`.
- Backend errors flow through the centralized error handler using `HttpError` with an
  accurate status code and a human-readable message.
- Frontend state follows the existing `RoomStore` pattern in `frontend/src/state/roomStore.ts`;
  API access goes through `frontend/src/services/api.ts`.
- The UI MUST NOT crash on API failures; errors are surfaced to the user as readable messages.
- Functional React components with hooks only; styles live in `app.css` or CSS modules.
- Prefer pure functions and immutable updates for game-rule logic so it can be unit tested.

Rationale: consistent layering and validation keep changes small, reviewable, and safe.

### V. Verified Before Committed

- Every game rule in Principle II MUST have at least one vitest unit test against the backend
  service layer, including its edge cases (empty input, invalid code, wrong role, too few
  players, case variations, cross-room isolation).
- `npm run build` and `npm test` MUST pass in both `backend/` and `frontend/` before each commit.
- Each feature group MUST be validated manually with two browser sessions against its
  acceptance criteria before work on the next group begins; results are recorded in the
  feature's `tasks.md`.
- A failing test or acceptance criterion is reported as-is and never hidden or skipped
  silently.

Rationale: tests and two-browser validation are the evidence that the implementation matches
the specification.

### VI. Reviewed, Traceable AI Assistance

- AI-generated output (specs, plans, tasks, code) MUST be read and reviewed by the developer
  before it is committed; it is never accepted blindly.
- AI MUST NOT expand scope beyond the active spec or violate Principles II–III; such output is
  rejected or corrected.
- Every generated code change MUST trace to a requirement in a `spec.md` and a task in the
  matching `tasks.md`.
- Significant AI corrections, rejections, and tradeoffs are recorded for the reflection report.

Rationale: the developer remains accountable for every line in the pull request.

## Technical Constraints

- **Sync**: all client updates use HTTP polling at an interval of about 2 seconds.
  WebSockets, Socket.io, server-sent events, or any other push protocol are forbidden.
- **Storage**: all data is held in memory in the backend process. No database of any kind
  (SQL, NoSQL, SQLite, key-value stores) and no file-based persistence. Restarting the backend
  clears all rooms.
- **Memory footprint**: room state stays minimal, and inactive rooms MUST be removed
  explicitly.
- **Identity**: no authentication, accounts, sessions, tokens, or OAuth. Players are identified
  only by the `participantId` returned when they create or join a room.
- **Runtime**: Node.js as pinned in `.nvmrc`; backend on port 3001, frontend on port 5173,
  configurable via `PORT` and `VITE_API_URL`.

## Development Workflow & Review

- **Feature groups**: work proceeds through the four README scenarios in order, with one
  Spec Kit feature folder per scenario (`specs/NNN-<name>/` containing `spec.md`, `plan.md`,
  and `tasks.md`).
- **Loop per feature**: discovery → specify → clarify → plan → tasks → implement → validate.
  A feature group is complete only when its acceptance criteria pass; the next group MUST NOT
  start before that.
- **Commits**: small and meaningful, one logical slice each, with messages that reference the
  feature and task ID (for example `feat(001): T004 host-only start endpoint`).
- **Deviations**: any difference between the implementation and the spec or plan is
  documented in the affected artifact and in the reflection report.
- **Self-review checklist before every commit**:
  1. The change traces to a spec requirement and a task ID.
  2. No out-of-scope behaviour (Principle III) or forbidden technology (Technical Constraints).
  3. No `any`; all new inputs are validated with Zod.
  4. Edge cases have tests; `npm run build` and `npm test` pass in both apps.
  5. The diff contains no unrelated changes.
- **Submission**: a pull request from the working branch to `main` on the fork, following the
  PR template (email and role filled in), with `REFLECTION.md` at the repository root.

## Governance

- This constitution supersedes other practices in this repository. `AGENTS.md` and the README
  provide runtime guidance and MUST stay consistent with it; on conflict, this document wins
  and the conflict is fixed.
- Amendments are made through `/speckit-constitution`, recorded with a version bump and a
  short rationale, and committed separately from feature work.
- Versioning follows semantic versioning: MAJOR for removed or redefined principles, MINOR for
  added principles or materially expanded guidance, PATCH for clarifications and wording.
- Every spec, plan, and tasks file MUST be checked against this constitution (for example with
  `/speckit-analyze`) before implementation begins, and every commit passes the self-review
  checklist above.

**Version**: 1.0.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-12
