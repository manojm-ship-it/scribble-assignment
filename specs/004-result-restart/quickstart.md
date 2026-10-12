# Quickstart & Validation: Result, Restart & Final Validation

Proves spec.md acceptance scenarios and the README's end-to-end flow. Contract:
`contracts/rooms-api.md`. Setup as in feature 001 (backend :3001, frontend :5173).

## 1. Automated checks

```bash
cd backend && npm run build && npm test
cd frontend && npm run build && npm test
temp/run-pr-checks.sh
```

## 2. API checks (backend running)

```bash
B=http://localhost:3001; J='content-type: application/json'; P='import json,sys; d=json.load(sys.stdin)'
r(){ curl -s -X POST $B/rooms/$CODE/restart -H "$J" -d "{\"participantId\":\"$1\"}"; echo; }
H=$(curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"Ann"}')
CODE=$(echo "$H" | python3 -c "$P; print(d['room']['code'])"); ANN=$(echo "$H" | python3 -c "$P; print(d['participantId'])")
BEN=$(curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{"playerName":"Ben"}' | python3 -c "$P; print(d['participantId'])")
r $ANN                                         # 409 The game has not started yet.
W1=$(curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$ANN\"}" | python3 -c "$P; print(d['room']['secretWord'])")
curl -s -X POST $B/rooms/$CODE/guesses -H "$J" -d "{\"participantId\":\"$BEN\",\"text\":\"$W1\"}" >/dev/null
curl -s "$B/rooms/$CODE?participantId=$BEN" | python3 -c "$P; r=d['room']; print(r['status'], r.get('secretWord'), [g['text'] for g in r['guesses']])"
#   ended <W1> [<W1>]   (word and correct text visible to the guesser after the end)
r $BEN                                         # 403 Only the host can restart the game.
r $ANN | python3 -c "$P; r=d['room']; print(r['status'], r['drawerId'], 'secretWord' in r, r['guesses'], [(p['name'],p['score']) for p in r['participants']])"
#   lobby None False [] [('Ann', 0), ('Ben', 0)]
r $ANN                                         # 409 The game has not started yet. (duplicate restart)
W2=$(curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$ANN\"}" | python3 -c "$P; print(d['room']['secretWord'])")
echo "$W1 -> $W2"                              # next word in the starter list (count 0 -> 1)
r $ANN | python3 -c "$P; print(d['room']['status'])"   # lobby (mid-round restart allowed)
```

## 3. Two-tab checks (tab A = Ann host/drawer, tab B = Ben)

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | Play a round until Ben guesses the word | Both tabs show "The word was <word>", final scores (Ben 100, Ann 0, highest first) and the full history with ✓ within ~2 s | US1.1–1.4 |
| 2 | A: view result | "Play again" button | US2.1 |
| 3 | B: view result | "Waiting for the host to start a new game."; no button | US2.1 |
| 4 | Both: look for "Exit Game" | Not present during the round or on the result | US3.1 |
| 5 | A: "Play again" | Both tabs in the lobby within ~2 s; Ann (host) and Ben listed | US2.2 |
| 6 | A: start again | New round; word is the next one by the rule; scores 0; empty history | US2.3–2.4 |
| 7 | A: "End game and return to lobby" mid-round | Both tabs back in the lobby | US2.7 |
