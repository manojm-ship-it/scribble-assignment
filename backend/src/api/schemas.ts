import { z } from "zod";

const playerNameSchema = z
  .string({ required_error: "Enter your name." })
  .trim()
  .min(1, "Enter your name.")
  .max(20, "Names can be at most 20 characters.");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
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
  participantId: z
    .string({ required_error: "A participant id is required to start the game." })
    .min(1, "A participant id is required to start the game.")
});

export const restartGameSchema = z.object({
  participantId: z
    .string({ required_error: "A participant id is required to restart the game." })
    .min(1, "A participant id is required to restart the game.")
});

export const submitGuessSchema = z.object({
  participantId: z
    .string({ required_error: "A participant id is required to guess." })
    .min(1, "A participant id is required to guess."),
  text: z.string({ required_error: "Enter a guess." }).trim().min(1, "Enter a guess.")
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
