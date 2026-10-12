# Specification Analysis Report: Room Setup & Lobby

Produced with `/speckit-analyze` on 2026-10-12 across `spec.md`, `plan.md`, `tasks.md` and the
constitution (v1.0.0), with supporting checks against `contracts/`, `data-model.md`,
`quickstart.md` and the source.

**Timing note**: the constitution's Governance section asks for this check *before*
implementation. Each plan's Constitution Check gate was completed before implementation, but this
cross-artifact analysis ran afterwards, once all four features were built. Findings are therefore
recorded rather than fixed before coding; the fixes would not have changed implemented behaviour.

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | MEDIUM | contracts/rooms-api.md:23, :28 | Contract shows `playerName` as optional. Feature 002 made it required and validated before the room lookup, so a join with a valid code and no name now returns "Enter your name." rather than 404/409. Feature 002 research R7 documents this, but the 001 contract does not point to it. | Add a note pointing to `specs/002-game-start-drawer/contracts/rooms-api.md`. |
| I2 | Inconsistency | LOW | contracts/rooms-api.md:36; data-model.md:12 | The 409 row says "Room status `playing`" and the status union is `lobby \| playing`. Feature 003 adds `ended`; the code refuses any non-lobby status. | Reword to "room not in the lobby" and note the widened union. |
| U1 | Underspecification | MEDIUM | spec.md:209 (SC-002) | SC-002 requires a join to appear within 3 s "in 10 out of 10 trials". Validation recorded single trials (tasks.md T028 rows 3 and 8, both within 2.5 s). | Run and record 10 timed trials, or reword SC-002 to match the evidence. |
| U2 | Underspecification | LOW | spec.md Edge Cases | "A refresh request … from a player not in it still returns the room without exposing any other room's data" has no dedicated test; the isolation test covers other rooms' data only. | Add a unit test for a fetch with an unknown participant id. |
| T1 | Terminology | LOW | quickstart.md:40 | The heading says "normal window A + private window B"; validation used separate tabs in one browser. That works because each tab keeps its own in-memory player. | Reword the heading to "two tabs or windows". |
| P1 | Process | MEDIUM | constitution.md:150 | Cross-artifact analysis ran after implementation instead of before (see Timing note). | Mention it in REFLECTION.md; run `/speckit-analyze` before `/speckit-implement` in future work. |

No duplication, ambiguous wording or unresolved placeholders were found.

## Coverage Summary

| Requirement | Has task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 | ✅ | T001, T002 | |
| FR-002 | ✅ | T008, T009 | |
| FR-003 | ✅ | T008, T009 | |
| FR-004 | ✅ | T010 | Manual check (T028 row 1) |
| FR-005 | ✅ | T005, T006 | |
| FR-006 | ✅ | T005, T011–T013 | |
| FR-007 | ✅ | T016 | Manual check (T028 row 3) |
| FR-008 | ✅ | T016 | Manual check (T028 row 9) |
| FR-009 | ✅ | T018–T020 | |
| FR-010 | ✅ | T018–T020 | |
| FR-011 | ✅ | T018, T023 | |
| FR-012 | ✅ | T023 | Manual check (T028 rows 2, 4) |
| FR-013 | ✅ | T025 | |
| FR-014 | ✅ | T014, T024–T026 | |
| FR-015 | ✅ | T004 | Two gaps were found and fixed during validation (see plan.md Deviations) |

**Constitution alignment**: no conflicts with any MUST principle in spec, plan or tasks (P1 is a
process timing issue).

**Unmapped tasks**: none. T002 and T006 carry no FR tag but test FR-001 and FR-005/FR-006 within
their phases.

## Metrics

- Functional requirements: 15 · Success criteria: 7 · Tasks: 29 (29 complete)
- Coverage: 100% (15/15 requirements have at least one task)
- Ambiguity: 0 · Duplication: 0 · Critical: 0 · Medium: 3 · Low: 3

## Next actions

No CRITICAL issues. I1 and I2 are documentation-only notes; U1 needs either more recorded trials or
a reworded criterion.
