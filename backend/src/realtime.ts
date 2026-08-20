import type { Server, Socket } from "socket.io";

const userSockets = new Map<string, Set<Socket>>();

export function registerRealtime(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(socket);

    socket.on("disconnect", () => {
      userSockets.get(userId)?.delete(socket);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
    });
  });
}

export function pushToUser(userId: string, event: string, payload: unknown) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const socket of sockets) socket.emit(event, payload);
}

export function isUserOnline(userId: string) {
  return (userSockets.get(userId)?.size ?? 0) > 0;
}
