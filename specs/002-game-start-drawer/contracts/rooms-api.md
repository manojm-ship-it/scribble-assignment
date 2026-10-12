# Contract: Rooms API changes (feature 002)

Changes on top of `specs/001-room-lobby/contracts/rooms-api.md`. Unchanged cases are not
repeated.

## RoomSnapshot

```json
{
  "code": "ABCD",
  "status": "playing",
  "hostId": "3f0c…",
  "drawerId": "3f0c…",
  "secretWord": "pizza",
  "participants": [{ "id": "3f0c…", "name": "Ann", "joinedAt": "…" }]
}
```

- `drawerId`: `null` while `status` is `"lobby"`.
- `secretWord`: **only** present when the request's viewer (`participantId` in the create/join
  response, the start body, or the fetch query string) equals `drawerId`. Omitted otherwise.
- `availableWords` and `roles` are no longer sent.

## POST /rooms and POST /rooms/:code/join — name validation

Request `{ "playerName": string }` (now required). Params are validated before the body.

| Case | Status | Body |
|---|---|---|
| `playerName` missing, empty or whitespace | 400 | "Enter your name." |
| `playerName` longer than 20 characters after trimming | 400 | "Names can be at most 20 characters." |
| Valid | 201 / 200 | as in feature 001; stored name is trimmed |

## POST /rooms/:code/start — success response

`200 { "room": RoomSnapshot }` where the viewer is the host, who is now the drawer, so the
response includes `secretWord`.

## GET /rooms/:code?participantId=

| Viewer | `secretWord` in response |
|---|---|
| the drawer | yes |
| another participant | no |
| an id not in the room | no |
| no `participantId` | no |
| anyone, room in lobby | no |
