# Contract: Rooms API changes (feature 003)

Changes on top of features 001–002 contracts.

## RoomSnapshot additions

```json
{
  "status": "playing",
  "participants": [
    { "id": "a1…", "name": "Ann", "joinedAt": "…", "score": 0 },
    { "id": "b2…", "name": "Ben", "joinedAt": "…", "score": 100 }
  ],
  "guesses": [
    { "id": "g1…", "participantId": "b2…", "text": "burger", "correct": false },
    { "id": "g2…", "participantId": "b2…", "text": null, "correct": true }
  ]
}
```

- `status` may now be `"ended"`.
- `guesses[].text` is `null` for correct guesses while `status` is `"playing"`; the real text is
  sent once `status` is `"ended"`.

## POST /rooms/:code/guesses (new)

Request `{ "participantId": string, "text": string }`

| Case (checked in this order) | Status | Body |
|---|---|---|
| Invalid code | 400 | feature 001 messages |
| `text` missing / blank | 400 | "Enter a guess." |
| `participantId` missing | 400 | "A participant id is required to guess." |
| No such room | 404 | "This room is no longer available." |
| Room not `playing` | 409 | "The round is not in progress." |
| Participant not in room | 403 | "You are not a player in this room." |
| Participant is the drawer | 403 | "The drawer cannot guess." |
| Already guessed correctly | 409 | "You already guessed the word." |
| Accepted | 200 | `{ "room": RoomSnapshot }` (viewer = guesser); score +100 if correct; `status` `"ended"` if this was the last guesser to get it |

## POST /rooms/:code/start (changed behaviour)

Also resets every participant's `score` to 0 and clears `guesses`.
