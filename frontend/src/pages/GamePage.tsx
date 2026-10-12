import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { useRoomPolling } from "../state/useRoomPolling";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const { refreshError } = useRoomPolling();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId !== null && participantId === room.drawerId;
  const roundOver = room.status === "ended";
  const hasGuessedCorrectly = room.guesses.some(
    (guess) => guess.participantId === participantId && guess.correct
  );

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} participantId={participantId} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <DrawingCanvas />
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                {drawer ? `${drawer.name} is drawing` : "Waiting for drawer..."}
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer ? `${drawer.name} is drawing` : "Waiting for the drawer"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{isDrawer ? "You are the drawer" : "You are guessing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Secret Word">
            {isDrawer && room.secretWord ? (
              <p>
                Your word: <strong>{room.secretWord}</strong>
              </p>
            ) : (
              <p>The word is hidden. Watch the drawing and guess!</p>
            )}
          </Card>

          <Card title="Your Guess">
            {roundOver ? (
              <p>
                <strong>Round over! Everyone guessed the word.</strong>
              </p>
            ) : null}
            {refreshError ? <p className="form__error">{refreshError}</p> : null}
            <GuessForm
              disabled={isDrawer || roundOver || hasGuessedCorrectly}
              onSubmit={async (text) => {
                await roomStore.submitGuess(text);
              }}
            />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
