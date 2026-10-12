# Contract: Rooms API changes (feature 004)

Changes on top of features 001–003.

## RoomSnapshot

- `secretWord` is now present for **every** viewer when `status` is `"ended"` (still drawer-only
  while `"playing"`, absent in `"lobby"`).

## POST /rooms/:code/restart (new)

Request `{ "participantId": string }`

| Case (checked in this order) | Status | Body |
|---|---|---|
| Invalid code | 400 | feature 001 messages |
| `participantId` missing | 400 | "A participant id is required to restart the game." |
| No such room | 404 | "This room is no longer available." |
| Room in `lobby` | 409 | "The game has not started yet." |
| Requester is not the host | 403 | "Only the host can restart the game." |
| Restarted (from `playing` or `ended`) | 200 | `{ "room": RoomSnapshot }` with `status: "lobby"`, `drawerId: null`, no `secretWord`, `guesses: []`, every `score` 0, same participants |
