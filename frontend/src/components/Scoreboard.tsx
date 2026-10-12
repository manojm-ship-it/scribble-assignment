import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
  participantId: string | null;
}

export function Scoreboard({ participants, participantId }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      <ul className="player-list">
        {participants.map((participant) => (
          <li key={participant.id}>
            <span>
              {participant.name}
              {participant.id === participantId ? " (you)" : ""}
            </span>
            <strong>{participant.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
