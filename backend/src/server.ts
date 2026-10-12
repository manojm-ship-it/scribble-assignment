import { createApp } from "./app.js";
import { removeInactiveRooms } from "./services/roomStore.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const app = createApp();

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number");
}

setInterval(() => {
  removeInactiveRooms(Date.now());
}, 60 * 1000).unref();

app.listen(port, host, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
