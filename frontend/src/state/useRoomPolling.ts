import { useEffect, useState } from "react";
import { ApiError } from "../services/api";
import { useRoomState, useRoomStore } from "./roomStore";

const POLL_INTERVAL_MS = 2000;

export function useRoomPolling() {
  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const roomCode = room?.code;

  async function refresh() {
    try {
      await roomStore.fetchRoom();
      setRefreshError(null);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        roomStore.clearRoom("This room is no longer available.");
        return;
      }

      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  useEffect(() => {
    if (!roomCode) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [roomCode]);

  return { refreshError, refresh };
}
