import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { useRoomPolling } from "../state/useRoomPolling";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const { refreshError, refresh: handleRefresh } = useRoomPolling();
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    } else if (room.status === "playing") {
      navigate("/game");
    }
  }, [navigate, room]);

  async function handleStart() {
    try {
      setStartError(null);
      await roomStore.startGame();
    } catch (caughtError) {
      setStartError(caughtError instanceof Error ? caughtError.message : "Unable to start the game");
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const hasEnoughPlayers = room.participants.length >= 2;
  const waitingMessage = !isHost
    ? "Waiting for the host to start the game."
    : hasEnoughPlayers
      ? "Ready to start the game."
      : "Waiting for at least 2 players.";

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>
                    {participant.name}
                    {participant.id === participantId ? " (you)" : ""}
                  </span>
                  <span className="player-list__meta">
                    {participant.id === room.hostId ? "host" : "joined"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{startError ?? error ?? refreshError ?? waitingMessage}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
          {isLoading ? "Refreshing..." : "Refresh Room"}
        </button>
        {isHost ? (
          <button className="button button--primary" disabled={!hasEnoughPlayers} onClick={handleStart}>
            Start Game
          </button>
        ) : null}
      </div>
    </section>
  );
}
