# CartaVerso

Red social + juego de cartas 1v1 en tiempo real (estilo Hearthstone/Magic), ambientado en el multiverso de Aralon.

## Stack

- **Backend**: Node + Express + Socket.io + Prisma + PostgreSQL (puerto 4010 en local)
- **Frontend**: React + Vite + TypeScript + Tailwind (puerto 5180 en local)

## Primer arranque

1. Levantar Postgres local (elegí una opción):
   - `docker compose up -d` (desde la raíz del repo, requiere Docker Desktop corriendo)
   - o usar una base ya existente y ajustar `DATABASE_URL` en `backend/.env`

2. Backend:
   ```bash
   cd backend
   cp .env.example .env   # ajustar si hace falta
   npm install
   npx prisma migrate dev --name init
   npm run prisma:seed
   npm run dev
   ```

3. Frontend:
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Abrir http://localhost:5180, registrarte, armar un mazo de 30 cartas en "Mazos" y buscar partida en "Batalla" (abrí dos sesiones/navegadores para probar el 1v1).

## Estructura

- `backend/prisma/schema.prisma` — modelo de datos (usuarios, cartas, mazos, partidas, posts, follows, notificaciones)
- `backend/prisma/seed.ts` — set inicial de ~40 cartas (5 facciones elementales)
- `backend/src/game/engine.ts` — motor de combate 1v1 (turnos, energía, ataque, hechizos)
- `backend/src/game/socket.ts` — matchmaking y partidas en tiempo real vía Socket.io
- `frontend/src/pages/BattlePage.tsx` — lobby + tablero de juego en vivo
