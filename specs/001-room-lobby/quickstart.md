# Quickstart & Validation: Room Setup & Lobby

Proves spec.md acceptance scenarios end to end. Contract details: `contracts/rooms-api.md`.

## Prerequisites

- Node as pinned in `.nvmrc`; `npm ci` run in `backend/` and `frontend/`.
- Terminal 1: `cd backend && npm run dev` (port 3001).
- Terminal 2: `cd frontend && npm run dev` (port 5173). Do **not** set `VITE_API_URL` (FR-001).

## 1. Automated checks

```bash
cd backend && npm run build && npm test     # roomStore + schema rules
cd frontend && npm run build && npm test    # api default URL + start request
temp/run-pr-checks.sh                       # all four PR checks (from repo root)
```

Expected: all pass; backend tests include host, join refusal, start rules, isolation and
cleanup cases.

## 2. API checks (backend running)

```bash
B=http://localhost:3001; J='content-type: application/json'
H=$(curl -s -X POST $B/rooms -H "$J" -d '{"playerName":"Host"}')
CODE=$(echo "$H" | node -pe 'JSON.parse(require("fs").readFileSync(0)).room.code')
HOST=$(echo "$H" | node -pe 'JSON.parse(require("fs").readFileSync(0)).participantId')
curl -s -X POST $B/rooms/ZZZZ/join -H "$J" -d '{}'              # 404 Room not found…
curl -s -X POST $B/rooms/AB/join -H "$J" -d '{}'                # 400 Room codes are 4 letters…
curl -s -X POST "$B/rooms/%20%20/join" -H "$J" -d '{}'          # 400 Enter a room code.
curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$HOST\"}"   # 400 At least 2…
G=$(curl -s -X POST $B/rooms/$(echo $CODE | tr A-Z a-z)/join -H "$J" -d '{"playerName":"Guest"}')
GUEST=$(echo "$G" | node -pe 'JSON.parse(require("fs").readFileSync(0)).participantId')
curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$GUEST\"}"  # 403 Only the host…
curl -s -X POST $B/rooms/$CODE/start -H "$J" -d "{\"participantId\":\"$HOST\"}"   # 200 status playing
curl -s -X POST $B/rooms/$CODE/join -H "$J" -d '{}'             # 409 already started
```

## 3. Two-browser checks (normal window A + private window B)

| # | Steps | Expected | Spec |
|---|---|---|---|
| 1 | A: create room as "Ann" | Lobby shows code, "Ann (you)" marked host | US1.1–1.2 |
| 2 | A: only player present | Start disabled, "Waiting for at least 2 players." | US4.1 |
| 3 | B: join with the code typed in lower case as "Ben" | B lands in lobby; within ~2 s A shows Ben with no clicks | US2.1, US3.1 |
| 4 | B: view lobby | No start control; "Waiting for the host to start the game." | US4.2 |
| 5 | B (new tab): join with empty, `AB`, `ZZZZ` | Each refused with its message, no crash | US2.2–2.4 |
| 6 | A: start | A and B both reach the game screen within ~3 s | US4.3, SC-005 |
| 7 | New private window: join the same code | "This game has already started." | US2.5 |
| 8 | Repeat 1–3 in a second room while room 1 is open | Room 1's list and state unchanged | US5.1 |
| 9 | Stop the backend while A is in a lobby, then restart it | Lobby shows an error, then "This room is no longer available." and returns to start | US3.2–3.3 |

Inactivity removal (US5.2–5.3) is verified by the `removeInactiveRooms` unit tests rather than
by waiting 30 minutes.
