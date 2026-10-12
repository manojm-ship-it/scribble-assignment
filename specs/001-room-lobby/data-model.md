# Data Model: Room Setup & Lobby

All state lives in the backend's in-memory `Map<string, Room>` (`backend/src/services/roomStore.ts`).
Types are in `backend/src/models/game.ts`; the frontend mirrors the snapshot type in
`frontend/src/services/api.ts`.

## Room (server-side, changed)

| Field | Type | Change | Rule |
|---|---|---|---|
| `code` | `string` | existing | 4 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; unique among active rooms (FR-002) |
| `status` | `"lobby" \| "playing"` | widened from `"lobby"` | starts `"lobby"`; only `startGame` moves it to `"playing"` |
| `hostId` | `string` | **new** | id of the creating participant; set once at creation, never changes (FR-003) |
| `participants` | `Participant[]` | existing | join order; host is first; duplicate names allowed |
| `lastActiveAt` | `number` (epoch ms) | **new** | set on create, join, fetch and start (FR-014) |
| `createdAt`, `updatedAt` | `string` (ISO) | existing | unchanged behaviour |

## Participant (unchanged)

| Field | Type | Rule |
|---|---|---|
| `id` | `string` (UUID) | issued on create/join; the only player identity |
| `name` | `string` | starter behaviour kept; validation is feature 002 |
| `joinedAt` | `string` (ISO) | set on join |

## RoomSnapshot (sent to clients, changed)

| Field | Change | Notes |
|---|---|---|
| `code`, `participants`, `availableWords`, `roles` | existing | unchanged |
| `status` | widened | `"lobby"` or `"playing"` |
| `hostId` | **new** | lets every client mark the host and show the start control only to the host |

`lastActiveAt`, `createdAt` and `updatedAt` are not sent to clients.

## State transitions

```text
            create
              │
              ▼
        ┌──────────┐   startGame (host, ≥2 players)   ┌───────────┐
        │  lobby   │ ───────────────────────────────▶ │  playing  │
        └──────────┘                                  └───────────┘
              │  join allowed                               │  join refused (409)
              │                                             │  start refused (409)
              ▼                                             ▼
   idle > 30 min in any state → removed from memory
```

Restart (`playing` → `lobby`) is added in feature 004.

## Validation rules

| Input | Rule | Refusal |
|---|---|---|
| Room code (path) | trim; non-empty | 400 "Enter a room code." |
| Room code (path) | `/^[A-Za-z0-9]{4}$/` after trim; then upper-cased | 400 "Room codes are 4 letters or numbers." |
| Room code (lookup) | must exist | 404 "Room not found. Check the code and try again." (join) / "This room is no longer available." (fetch, start) |
| Join | room `status` is `"lobby"` | 409 "This game has already started." |
| Start body | `participantId` non-empty string | 400 (Zod message) |
| Start | `participantId === hostId` | 403 "Only the host can start the game." |
| Start | room `status` is `"lobby"` | 409 "This game has already started." |
| Start | `participants.length >= 2` | 400 "At least 2 players are needed to start." |
