# Data Model: Result, Restart & Final Validation

No new fields. Changes are a new transition and a visibility rule on existing data
(features 001–003).

## State transitions

```text
          start (host, ≥2)                 every guesser correct
 lobby ───────────────────▶ playing ──────────────────────────────▶ ended
   ▲                            │                                     │
   │   restart (host)           │  restart (host, "End game")         │  restart (host, "Play again")
   └────────────────────────────┴─────────────────────────────────────┘
```

## Restart effects

| Field | After restart |
|---|---|
| `status` | `"lobby"` |
| `hostId` | unchanged |
| `participants` | unchanged ids, names, join order; every `score` = 0 |
| `drawerId` | `null` |
| `secretWord` | `null` |
| `guesses` | `[]` |
| `gamesStarted` | unchanged (next start uses it in the word rule) |
| `code` | unchanged |

## Visibility (RoomSnapshot)

| Field | Lobby | Playing | Ended |
|---|---|---|---|
| `secretWord` | never | drawer only | **every viewer** |
| `guesses[].text` for correct guesses | — | `null` | real text |

## Refusal rules (restart)

| Check (in order) | Status | Message |
|---|---|---|
| `participantId` missing | 400 | "A participant id is required to restart the game." |
| Room not found | 404 | "This room is no longer available." |
| `status === "lobby"` | 409 | "The game has not started yet." |
| Requester is not the host | 403 | "Only the host can restart the game." |
