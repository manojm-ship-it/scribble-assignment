import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema trims and upper-cases a valid code", () => {
    expect(roomCodeParamsSchema.parse({ code: " abcd " }).code).toBe("ABCD");
  });

  it("roomCodeParamsSchema rejects a blank code with a clear message", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow("Enter a room code.");
  });

  it.each(["AB", "ABCDE", "AB!D"])("roomCodeParamsSchema rejects malformed code %s", (code) => {
    expect(() => roomCodeParamsSchema.parse({ code })).toThrow(
      "Room codes are 4 letters or numbers."
    );
  });

  it("startGameSchema rejects a missing participantId with a readable message", () => {
    expect(() => startGameSchema.parse({})).toThrow("A participant id is required to start the game.");
  });
});
