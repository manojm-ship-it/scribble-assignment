import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a room code.")
    .regex(/^[A-Za-z0-9]{4}$/, "Room codes are 4 letters or numbers.")
    .transform((code) => code.toUpperCase())
});

export const startGameSchema = z.object({
  participantId: z.string().min(1, "A participant id is required to start the game.")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
