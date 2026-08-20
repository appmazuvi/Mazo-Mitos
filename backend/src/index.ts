import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { cardsRouter } from "./routes/cards.js";
import { decksRouter } from "./routes/decks.js";
import { postsRouter } from "./routes/posts.js";
import { notificationsRouter } from "./routes/notifications.js";
import { uploadsRouter } from "./routes/uploads.js";
import { adminRouter } from "./routes/admin.js";
import { searchRouter } from "./routes/search.js";
import { messagesRouter } from "./routes/messages.js";
import { registerGameSocket } from "./game/socket.js";
import { registerRealtime } from "./realtime.js";
import { verifyToken } from "./auth.js";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/cards", cardsRouter);
app.use("/api/decks", decksRouter);
app.use("/api/posts", postsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/search", searchRouter);
app.use("/api/messages", messagesRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("No autenticado"));
    const payload = verifyToken(token);
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});

registerRealtime(io);
registerGameSocket(io);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`CartaVerso backend escuchando en puerto ${port}`);
});
