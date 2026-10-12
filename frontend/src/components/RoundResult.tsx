import type { ReactNode } from "react";
import type { Participant } from "../services/api";
import { Card } from "./Card";

interface RoundResultProps {
  word: string | undefined;
  participants: Participant[];
  action: ReactNode;
}

export function RoundResult({ word, participants, action }: RoundResultProps) {
  const finalScores = [...participants].sort((first, second) => second.score - first.score);

  return (
    <Card title="Round Result">
      <p>
        The word was <strong>{word ?? "unknown"}</strong>
      </p>
      <ol className="player-list">
        {finalScores.map((participant) => (
          <li key={participant.id}>
            <span>{participant.name}</span>
            <strong>{participant.score}</strong>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: "16px" }}>{action}</div>
    </Card>
  );
}
