# Data Model: Gameplay Interaction

Extends features 001–002. Types in `backend/src/models/game.ts`; mirrored in
`frontend/src/services/api.ts`.

## Participant (changed)

| Field | Type | Change | Rule |
|---|---|---|---|
| `score` | `number` | **new** | 0 on create/join; reset to 0 by `startGame`; +100 per correct guess (FR-007) |

## Guess (new, server-side)

| Field | Type | Rule |
|---|---|---|
| `id` | `string` (UUID) | unique |
| `participantId` | `string` | the guesser; never the drawer |
| `text` | `string` | trimmed; non-empty |
| `correct` | `boolean` | `text.toLowerCase() === secretWord.toLowerCase()` |
| `createdAt` | `string` (ISO) | submission time; array order is history order |

## Room (changed)

| Field | Type | Change | Rule |
|---|---|---|---|
| `status` | `"lobby" \| "playing" \| "ended"` | widened | `playing → ended` when every guesser is correct (FR-014) |
| `guesses` | `Guess[]` | **new** | `[]` at creation; cleared by `startGame` |

## RoomSnapshot (changed)

| Field | Change | Notes |
|---|---|---|
| `participants[].score` | **new** | every viewer sees all scores |
| `guesses` | **new** | `GuessView[]` in submission order |

`GuessView`: `{ id, participantId, text: string | null, correct }` — `text` is `null` for a
correct guess while `status === "playing"` (FR-011).

## State transitions

```text
lobby ──start──▶ playing ──(every guesser correct)──▶ ended
                  scores := 0, guesses := []           guesses refused (409)
```

`ended → lobby` (restart) is feature 004.

## Validation and refusal rules (guesses)

| Check (in order) | Status | Message |
|---|---|---|
| `text` missing or blank after trim | 400 | "Enter a guess." |
| `participantId` missing | 400 | "A participant id is required to guess." |
| Room not found | 404 | "This room is no longer available." |
| `status !== "playing"` | 409 | "The round is not in progress." |
| Participant not in room | 403 | "You are not a player in this room." |
| Participant is the drawer | 403 | "The drawer cannot guess." |
| Participant already guessed correctly | 409 | "You already guessed the word." |
