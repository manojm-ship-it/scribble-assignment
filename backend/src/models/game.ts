export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  createdAt: string;
}

export interface GuessView {
  id: string;
  participantId: string;
  text: string | null;
  correct: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  gamesStarted: number;
  participants: Participant[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
  lastActiveAt: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  participants: Participant[];
  guesses: GuessView[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
