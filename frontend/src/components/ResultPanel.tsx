import type { GuessView, Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessView[];
  participants: Participant[];
}

function describeGuess(guess: GuessView, name: string) {
  if (guess.text === null) {
    return `${name} guessed the word!`;
  }

  return guess.correct ? `${name}: ${guess.text} ✓` : `${name}: ${guess.text}`;
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  const nameOf = (id: string) =>
    participants.find((participant) => participant.id === id)?.name ?? "Unknown player";

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p>No guesses yet.</p>
      ) : (
        <ul className="player-list guess-history">
          {guesses.map((guess) => (
            <li key={guess.id}>{describeGuess(guess, nameOf(guess.participantId))}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
