# Data Model: Game Start & Drawer Flow

Extends feature 001's model (`specs/001-room-lobby/data-model.md`). Types live in
`backend/src/models/game.ts`; the frontend mirrors `RoomSnapshot` in `frontend/src/services/api.ts`.

## Room (server-side, changed)

| Field | Type | Change | Rule |
|---|---|---|---|
| `drawerId` | `string \| null` | **new** | `null` in lobby; set to `hostId` by `startGame` (FR-004) |
| `secretWord` | `string \| null` | **new** | `null` in lobby; set by `startGame` via the word rule (FR-006) |
| `gamesStarted` | `number` | **new** | `0` at creation; incremented by each successful start |
| other fields | — | unchanged | see feature 001 |

## Participant (changed rule)

| Field | Rule |
|---|---|
| `name` | trimmed; 1–20 characters; no default (the starter's `"Player"` fallback is removed) |

## RoomSnapshot (sent to clients, changed)

| Field | Change | Notes |
|---|---|---|
| `drawerId` | **new** | `string \| null`; visible to everyone (FR-005) |
| `secretWord` | **new, conditional** | present only when the viewer's `participantId === drawerId` (FR-007) |
| `availableWords` | **removed** | FR-009 |
| `roles` | **removed** | FR-009 (unused) |
| `code`, `status`, `hostId`, `participants` | unchanged | |

## Word rule

```text
index = (Σ charCode(c) for c in room.code  +  room.gamesStarted) mod 5
words = [rocket, pizza, castle, guitar, sunflower]
```

| Room code | Σ char codes | gamesStarted | index | word |
|---|---|---|---|---|
| `ABCD` | 266 | 0 | 1 | pizza |
| `ABCD` | 266 | 1 | 2 | castle |
| `AAAA` | 260 | 0 | 0 | rocket |

## State transitions (additions to feature 001)

```text
lobby  ──startGame (host, ≥2)──▶  playing
drawerId: null                    drawerId = hostId
secretWord: null                  secretWord = rule(code, gamesStarted)
gamesStarted: n                   gamesStarted: n + 1
```

## Validation rules (names)

| Input | Rule | Refusal |
|---|---|---|
| `playerName` missing | required | 400 "Enter your name." |
| `playerName` | trimmed, length ≥ 1 | 400 "Enter your name." |
| `playerName` | trimmed, length ≤ 20 | 400 "Names can be at most 20 characters." |
