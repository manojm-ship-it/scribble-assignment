import { describe, expect, it } from "vitest";
import {
  createRoom,
  getRoom,
  joinRoom,
  removeInactiveRooms,
  ROOM_IDLE_LIMIT_MS,
  saveRoom,
  startGame,
  toRoomSnapshot
} from "./roomStore.js";

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

  it("startGame refuses a non-host", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(() => startGame(host.room.code, guest.participantId)).toThrow(
      "Only the host can start the game."
    );
    expect(getRoom(host.room.code)?.status).toBe("lobby");
  });

  it("startGame refuses a participant id that is not in the room", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    expect(() => startGame(host.room.code, "not-a-player")).toThrow(
      "Only the host can start the game."
    );
  });

  it("startGame refuses to start with fewer than 2 players", () => {
    const host = createRoom("Alice");

    expect(() => startGame(host.room.code, host.participantId)).toThrow(
      "At least 2 players are needed to start."
    );
    expect(getRoom(host.room.code)?.status).toBe("lobby");
  });

  it("startGame moves the room to playing when the host starts with 2 players", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    expect(startGame(host.room.code, host.participantId).status).toBe("playing");
    expect(getRoom(host.room.code)?.status).toBe("playing");
  });

  it("startGame refuses a game that has already started", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    expect(() => startGame(host.room.code, host.participantId)).toThrow(
      "This game has already started."
    );
  });

  it("removeInactiveRooms removes a room idle for longer than 30 minutes", () => {
    const host = createRoom("Alice");
    const lastActiveAt = getRoom(host.room.code)!.lastActiveAt;

    removeInactiveRooms(lastActiveAt + ROOM_IDLE_LIMIT_MS + 1);

    expect(getRoom(host.room.code)).toBeNull();
    expect(() => joinRoom(host.room.code, "Bob")).toThrow(
      "Room not found. Check the code and try again."
    );
  });

  it("removeInactiveRooms keeps a room active within the last 30 minutes", () => {
    const host = createRoom("Alice");
    const lastActiveAt = getRoom(host.room.code)!.lastActiveAt;

    removeInactiveRooms(lastActiveAt + ROOM_IDLE_LIMIT_MS - 1000);

    expect(getRoom(host.room.code)).not.toBeNull();
  });

  it("room isolation: actions in one room leave another room unchanged", () => {
    const first = createRoom("Alice");
    const second = createRoom("Zed");
    const before = toRoomSnapshot(getRoom(second.room.code)!);

    joinRoom(first.room.code, "Bob");
    startGame(first.room.code, first.participantId);

    expect(toRoomSnapshot(getRoom(second.room.code)!)).toEqual(before);
    expect(getRoom(first.room.code)?.status).toBe("playing");
  });
});
