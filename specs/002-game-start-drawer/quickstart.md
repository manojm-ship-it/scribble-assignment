# Quickstart & Validation: Game Start & Drawer Flow

Proves spec.md acceptance scenarios. Contract: `contracts/rooms-api.md`. Setup as in
`specs/001-room-lobby/quickstart.md` (backend :3001, frontend :5173, no `VITE_API_URL`).

## 1. Automated checks

```bash
cd backend && npm run build && npm test     # name schema, word rule, drawer, visibility
cd frontend && npm run build && npm test
temp/run-pr-checks.sh                       # from repo root
```

## 2. API checks (backend running)

```bash
B=http://localhost:3001; J='content-type: application/json'
P='import json,sys; d=json.load(sys.stdin)'
curl -s -X POST $B/rooms -H "$J" -d '{}'                                  # 400 Enter your name.
curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"   "}'                # 400 Enter your name.
curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"ABCDEFGHIJKLMNOPQRSTU"}'  # 400 at most 20
H=$(curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"  Ann  "}')
echo "$H" | python3 -c "$P; print(repr(d['room']['participants'][0]['name']), d['room']['drawerId'], 'secretWord' in d['room'], 'availableWords' in d['room'])"
#   'Ann' None False False
CODE=$(echo "$H" | python3 -c "$P; print(d['room']['code'])")
HOST=$(echo "$H" | python3 -c "$P; print(d['participantId'])")
curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{"playerName":""}'       # 400 Enter your name.
G=$(curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{"playerName":"ABCDEFGHIJKLMNOPQRST"}')  # 20 chars OK
GUEST=$(echo "$G" | python3 -c "$P; print(d['participantId'])")
curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$HOST\"}" | python3 -c "$P; r=d['room']; print(r['drawerId']=='$HOST', r.get('secretWord'))"
#   True <word predicted by the rule for $CODE with gamesStarted 0>
for V in "?participantId=$GUEST" "?participantId=nobody" ""; do
  curl -s "$B/rooms/$CODE$V" | python3 -c "$P; print('secretWord' in d['room'])"   # False ×3
done
curl -s "$B/rooms/$CODE?participantId=$HOST" | python3 -c "$P; print(d['room'].get('secretWord'))"  # the word
```

Predicted word for any code: `python3 -c "c='$CODE'; w=['rocket','pizza','castle','guitar','sunflower']; print(w[sum(map(ord,c))%5])"`.

## 3. Two-tab checks

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | Create room with an empty name, then with spaces only | "Enter your name."; no room | US1.1 |
| 2 | Create with a 21-character name | "Names can be at most 20 characters." | US1.4 |
| 3 | Tab A: create as `"  Ann  "` | Lobby shows `Ann (you)` | US1.3 |
| 4 | Tab B: join with the code and a blank name | "Enter your name." | US1.2 |
| 5 | Tab B: join as Ben; Tab A: start | Both on game screen | — |
| 6 | Tab A (drawer) | "Ann is drawing", "You are the drawer", "Your word: <predicted word>" | US2.2–2.3, US3.1, US4.1 |
| 7 | Tab B (guesser) | "Ann is drawing", "You are guessing", word hidden | US2.2–2.3, US3.2 |
