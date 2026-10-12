import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("createRoom sends POST to /rooms with playerName in body", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: "p1",
          room: { code: "ABCD", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ playerName: "Alice" }),
      })
    );
  });

  it("uses http://localhost:3001 as the default base URL", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ participantId: "p1", room: { code: "ABCD" } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.createRoom("Alice");

    expect(fetch).toHaveBeenCalledWith("http://localhost:3001/rooms", expect.anything());
  });

  it("fetchRoom sends GET to /rooms/:code with participantId query param", async () => {
    const mockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          room: { code: "XYZW", status: "lobby", participants: [] },
        }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.fetchRoom("XYZW", "p1");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/XYZW?participantId=p1"),
      expect.anything()
    );
  });

  it("startGame sends POST to /rooms/:code/start with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "playing", participants: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.startGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });

  it("turns a network failure into a readable ApiError", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.fetchRoom("ABCD")).rejects.toMatchObject({
      status: 0,
      message: "Can't reach the game server. Check your connection and try again.",
    });
  });

  it("submitGuess sends POST to /rooms/:code/guesses with participantId and text", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "playing", participants: [], guesses: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.submitGuess("ABCD", "p1", "pizza");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/guesses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1", text: "pizza" }),
      })
    );
  });

  it("restartGame sends POST to /rooms/:code/restart with participantId in body", async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ room: { code: "ABCD", status: "lobby", participants: [], guesses: [] } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await api.restartGame("ABCD", "p1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/rooms/ABCD/restart",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ participantId: "p1" }),
      })
    );
  });
});
