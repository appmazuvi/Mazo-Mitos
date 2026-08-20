import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { cardsRouter } from "./routes/cards.js";
import { decksRouter } from "./routes/decks.js";
import { postsRouter } from "./routes/posts.js";
import { notificationsRouter } from "./routes/notifications.js";
import { registerGameSocket } from "./game/socket.js";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/decks", decksRouter);
app.use("/api/posts", postsRouter);
app.use("/api/notifications", notificationsRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });
registerGameSocket(io);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`CartaVerso backend escuchando en puerto ${port}`);
});
