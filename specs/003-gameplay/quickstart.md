# Quickstart & Validation: Gameplay Interaction

Proves spec.md acceptance scenarios. Contract: `contracts/rooms-api.md`. Setup as in feature 001
(backend :3001, frontend :5173). Predict a room's word with:
`python3 -c "c='CODE'; w=['rocket','pizza','castle','guitar','sunflower']; print(w[sum(map(ord,c))%5])"`.

## 1. Automated checks

```bash
cd backend && npm run build && npm test
cd frontend && npm run build && npm test
temp/run-pr-checks.sh
```

## 2. API checks (backend running, three players: host Ann, guessers Ben and Cara)

```bash
B=http://localhost:3001; J='content-type: application/json'; P='import json,sys; d=json.load(sys.stdin)'
g(){ curl -s -X POST $B/rooms/$CODE/guesses -H "$J" -d "{\"participantId\":\"$1\",\"text\":\"$2\"}"; echo; }
H=$(curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"Ann"}')
CODE=$(echo "$H" | python3 -c "$P; print(d['room']['code'])"); ANN=$(echo "$H" | python3 -c "$P; print(d['participantId'])")
BEN=$(curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{"playerName":"Ben"}' | python3 -c "$P; print(d['participantId'])")
CARA=$(curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{"playerName":"Cara"}' | python3 -c "$P; print(d['participantId'])")
g $BEN pizza                                   # 409 The round is not in progress. (lobby)
WORD=$(curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$ANN\"}" | python3 -c "$P; print(d['room']['secretWord'])")
g $BEN "   "                                   # 400 Enter a guess.
g $ANN "$WORD"                                 # 403 The drawer cannot guess.
g nobody "$WORD"                               # 403 You are not a player in this room.
g $BEN burger                                  # 200, Ben score 0, history shows "burger"
g $BEN "  $(echo $WORD | tr a-z A-Z) "         # 200, Ben score 100, status playing, text null
g $BEN "$WORD"                                 # 409 You already guessed the word.
g $CARA "$WORD"                                # 200, Cara 100, status ended, texts revealed
g $CARA again                                  # 409 The round is not in progress.
```

## 3. Three-tab checks (tab A = Ann drawer, tabs B = Ben and C = Cara guessers)

A third tab is needed to see a correct guess hidden: with one guesser the round ends on the first
correct guess and the text is revealed immediately.

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | A: drag on the canvas | A line follows the pointer | US1.1 |
| 2 | A: press "Clear canvas", then draw again | Canvas blank, then drawable | US1.2 |
| 3 | B: view the canvas area | No canvas or Clear; "Ann is drawing" | US1.3 |
| 4 | All: view the scoreboard | Ann 0, Ben 0, Cara 0 | US3.4 |
| 5 | B: submit an empty guess | "Enter a guess." | US2.1 |
| 6 | B: submit a wrong guess | Within ~2 s, no clicks, A and C show "Ben: <guess>"; Ben still 0 | US2.2, US3.1–3.2 |
| 7 | B: submit the word in mixed case with spaces | Ben 100 on all screens; A and C show "Ben guessed the word!" (no text); round continues | US2.3, US3.3 |
| 8 | B: view the guess form | Disabled (the API refusal "You already guessed the word." is checked in §2) | US2.5 |
| 9 | C: submit the word | Cara 100; all screens show the round is over within ~2 s; history now shows the guessed text | US2.7, FR-014 |
| 10 | A: view the guess form throughout | Disabled for the drawer | US2.4 |
