# Contract: Rooms API (feature 001)

Base URL: `http://localhost:3001` (frontend default; override with `VITE_API_URL`).
All bodies are JSON. Every error response is `{ "message": string }` with a player-readable
message (FR-015). `:code` is trimmed, validated as 4 letters or digits, and upper-cased before
lookup (FR-005).

`RoomSnapshot`:

```json
{
  "code": "ABCD",
  "status": "lobby",
  "hostId": "3f0c…",
  "participants": [{ "id": "3f0c…", "name": "Alice", "joinedAt": "2026-10-12T10:00:00.000Z" }],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

## POST /rooms — create (changed: response adds `hostId`)

Request `{ "playerName"?: string }` → **201** `{ "participantId": string, "room": RoomSnapshot }`
where `room.hostId === participantId` and `room.status === "lobby"`.

## POST /rooms/:code/join — join (changed: validation and refusals)

Request `{ "playerName"?: string }`

| Case | Status | Body |
|---|---|---|
| Joined | 200 | `{ "participantId", "room": RoomSnapshot }` |
| Code blank after trim | 400 | "Enter a room code." |
| Code not 4 letters/digits | 400 | "Room codes are 4 letters or numbers." |
| No such room | 404 | "Room not found. Check the code and try again." |
| Room status `playing` | 409 | "This game has already started." |

## GET /rooms/:code?participantId= — fetch (changed: validation, message, activity)

| Case | Status | Body |
|---|---|---|
| Found | 200 | `{ "room": RoomSnapshot }` (also refreshes `lastActiveAt`) |
| Invalid code | 400 | as for join |
| No such room | 404 | "This room is no longer available." |

## POST /rooms/:code/start — start game (new)

Request `{ "participantId": string }`

| Case (checked in this order) | Status | Body |
|---|---|---|
| Invalid code / missing `participantId` | 400 | Zod message |
| No such room | 404 | "This room is no longer available." |
| `participantId` is not the host | 403 | "Only the host can start the game." |
| Room already `playing` | 409 | "This game has already started." |
| Fewer than 2 participants | 400 | "At least 2 players are needed to start." |
| Started | 200 | `{ "room": RoomSnapshot }` with `status: "playing"` |
