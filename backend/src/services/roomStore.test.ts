import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, saveRoom, toRoomSnapshot } from "./roomStore.js";

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

  it("joinRoom adds a non-host participant to an existing room", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest.room.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(guest.room.hostId).toBe(host.participantId);
    expect(guest.participantId).not.toBe(host.participantId);
  });

  it("joinRoom refuses an unknown room code with a clear message", () => {
    expect(() => joinRoom("ZZZZ", "Bob")).toThrow("Room not found. Check the code and try again.");
  });

  it("joinRoom refuses a room whose game has already started", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = getRoom(host.room.code)!;
    saveRoom({ ...room, status: "playing" });

    expect(() => joinRoom(host.room.code, "Cara")).toThrow("This game has already started.");
  });
});
