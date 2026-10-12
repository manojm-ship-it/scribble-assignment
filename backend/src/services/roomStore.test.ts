import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom records the creator as host and exposes hostId in the snapshot", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
    expect(toRoomSnapshot(result.room).hostId).toBe(result.participantId);
  });

  it("createRoom gives every active room a distinct code", () => {
    const codes = new Set(Array.from({ length: 50 }, () => createRoom("Host").room.code));

    expect(codes.size).toBe(50);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });
});
