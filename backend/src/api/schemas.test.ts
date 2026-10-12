import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";

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

  describe.each([
    ["createRoomSchema", createRoomSchema],
    ["joinRoomSchema", joinRoomSchema]
  ])("%s player name", (_name, schema) => {
    it.each([{}, { playerName: "" }, { playerName: "   " }])("rejects %j with a clear message", (body) => {
      expect(() => schema.parse(body)).toThrow("Enter your name.");
    });

    it("trims surrounding spaces", () => {
      expect(schema.parse({ playerName: "  Ann  " }).playerName).toBe("Ann");
    });

    it("accepts a 20-character name", () => {
      expect(schema.parse({ playerName: "A".repeat(20) }).playerName).toBe("A".repeat(20));
    });

    it("rejects a 21-character name", () => {
      expect(() => schema.parse({ playerName: "A".repeat(21) })).toThrow(
        "Names can be at most 20 characters."
      );
    });
  });

  it.each([{ participantId: "p1" }, { participantId: "p1", text: "" }, { participantId: "p1", text: "   " }])(
    "submitGuessSchema rejects %j with \"Enter a guess.\"",
    (body) => {
      expect(() => submitGuessSchema.parse(body)).toThrow("Enter a guess.");
    }
  );

  it("submitGuessSchema trims the guess text", () => {
    expect(submitGuessSchema.parse({ participantId: "p1", text: "  Pizza " }).text).toBe("Pizza");
  });

  it("submitGuessSchema requires a participant id", () => {
    expect(() => submitGuessSchema.parse({ text: "pizza" })).toThrow(
      "A participant id is required to guess."
    );
  });

  it("restartGameSchema requires a participant id", () => {
    expect(() => restartGameSchema.parse({})).toThrow("A participant id is required to restart the game.");
  });
});
