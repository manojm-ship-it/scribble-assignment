import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export const ROOM_IDLE_LIMIT_MS = 30 * 60 * 1000;

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function selectSecretWord(code: string, gamesStarted: number) {
  const codeSum = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return STARTER_WORDS[(codeSum + gamesStarted) % STARTER_WORDS.length];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    gamesStarted: 0,
    participants: [participant],
    guesses: [],
    createdAt: now(),
    updatedAt: now(),
    lastActiveAt: Date.now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found. Check the code and try again.");
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "This game has already started.");
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  room.lastActiveAt = Date.now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.lastActiveAt = Date.now();
  return cloneRoom(room);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "This room is no longer available.");
  }

  if (participantId !== room.hostId) {
    throw new HttpError(403, "Only the host can start the game.");
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "This game has already started.");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are needed to start.");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectSecretWord(room.code, room.gamesStarted);
  room.gamesStarted += 1;
  room.updatedAt = now();
  room.lastActiveAt = Date.now();

  return cloneRoom(room);
}

export function removeInactiveRooms(nowMs: number) {
  let removed = 0;

  for (const [code, room] of rooms) {
    if (nowMs - room.lastActiveAt > ROOM_IDLE_LIMIT_MS) {
      rooms.delete(code);
      removed += 1;
    }
  }

  return removed;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({ ...participant })),
    guesses: room.guesses.map((guess) => ({
      id: guess.id,
      participantId: guess.participantId,
      text: guess.text,
      correct: guess.correct
    }))
  };

  if (room.secretWord && viewerParticipantId !== undefined && viewerParticipantId === room.drawerId) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}
