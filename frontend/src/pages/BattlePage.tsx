import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../lib/AuthContext";
import { GameCard } from "../components/GameCard";
import { Icon } from "../components/Icon";
import type { Deck, GameStateView } from "../types";

const TARGETED_SPELLS = ["DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6", "BUFF_ATTACK_2", "DESTROY_TARGET"];
const FACE_TARGETABLE = ["DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6"];
const OWN_ONLY = ["BUFF_ATTACK_2"];

type Selection =
  | { kind: "attacker"; instanceId: string }
  | { kind: "spell"; instanceId: string; needsFace: boolean; ownOnly: boolean }
  | null;

export function BattlePage() {
  const { user, token } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "queued" | "playing">("idle");
  const [game, setGame] = useState<GameStateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  useEffect(() => {
    api.get<Deck[]>("/api/decks").then((d) => {
      const validDecks = d.filter((deck) => deck.cards.reduce((s, c) => s + c.quantity, 0) === 30);
      setDecks(validDecks);
      if (validDecks[0]) setDeckId(validDecks[0].id);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.on("queue:joined", () => setStatus("queued"));
    socket.on("queue:error", ({ error }) => {
      setError(error);
      setStatus("idle");
    });
    socket.on("game:state", (state: GameStateView) => {
      setStatus("playing");
      setGame(state);
    });
    socket.on("game:error", ({ error }) => setError(error));

    return () => {
      socket.off("queue:joined");
      socket.off("queue:error");
      socket.off("game:state");
      socket.off("game:error");
    };
  }, [token]);

  function joinQueue() {
    if (!token || !deckId) return;
    setError(null);
    getSocket(token).emit("queue:join", { deckId });
  }

  function leaveQueue() {
    if (!token) return;
    getSocket(token).emit("queue:leave");
    setStatus("idle");
  }

  function sendAction(action: unknown) {
    if (!token || !game) return;
    getSocket(token).emit("game:action", { matchId: game.matchId, action });
    setSelection(null);
    setError(null);
  }

  const isMyTurn = game?.turnPlayerId === user?.id;

  function handleHandClick(instanceId: string) {
    if (!isMyTurn || !game) return;
    const card = game.me.hand.find((c) => c?.instanceId === instanceId);
    if (!card) return;

    if (card.type === "CREATURE") {
      sendAction({ type: "PLAY_CARD", instanceId });
      return;
    }
    if (card.effectKey && TARGETED_SPELLS.includes(card.effectKey)) {
      setSelection({
        kind: "spell",
        instanceId,
        needsFace: FACE_TARGETABLE.includes(card.effectKey),
        ownOnly: OWN_ONLY.includes(card.effectKey),
      });
    } else {
      sendAction({ type: "PLAY_CARD", instanceId });
    }
  }

  function handleMyCreatureClick(instanceId: string) {
    if (!game) return;
    if (selection?.kind === "spell") {
      if (selection.ownOnly || true) {
        sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId, targetInstanceId: instanceId });
      }
      return;
    }
    if (!isMyTurn) return;
    const creature = game.me.board.find((c) => c.instanceId === instanceId);
    if (!creature || creature.summoningSick || creature.hasAttacked) return;
    if (selection?.kind === "attacker" && selection.instanceId === instanceId) {
      setSelection(null);
      return;
    }
    setSelection({ kind: "attacker", instanceId });
  }

  function handleEnemyCreatureClick(instanceId: string) {
    if (!selection) return;
    if (selection.kind === "attacker") {
      sendAction({ type: "ATTACK", attackerInstanceId: selection.instanceId, targetInstanceId: instanceId });
    } else if (selection.kind === "spell" && !selection.ownOnly) {
      sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId, targetInstanceId: instanceId });
    }
  }

  function handleFaceClick() {
    if (!selection) return;
    if (selection.kind === "attacker") {
      sendAction({ type: "ATTACK", attackerInstanceId: selection.instanceId, targetInstanceId: "FACE" });
    } else if (selection.kind === "spell" && selection.needsFace) {
      sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId });
    }
  }

  const winnerLabel = useMemo(() => {
    if (!game || game.phase !== "FINISHED") return null;
    return game.winnerId === user?.id ? "¡Ganaste la partida!" : "Perdiste la partida.";
  }, [game, user]);

  if (status === "playing" && game) {
    return (
      <div className="h-screen flex flex-col p-4 gap-3 overflow-hidden">
        {winnerLabel && (
          <div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center">
            <div className="card-surface p-8 text-center">
              <p className="text-xl font-bold mb-4">{winnerLabel}</p>
              <button
                className="btn-primary px-5 py-2"
                onClick={() => {
                  setGame(null);
                  setStatus("idle");
                }}
              >
                Volver al lobby
              </button>
            </div>
          </div>
        )}

        <PlayerBar label="Rival" life={game.opponent.life} energy={game.opponent.energy} maxEnergy={game.opponent.maxEnergy} />

        <div className="flex gap-1 justify-center flex-wrap min-h-[3.5rem]">
          {game.opponent.hand.map((_, i) => (
            <div key={i} className="w-10 h-14 rounded-md bg-arcane-900 border border-arcane-700" />
          ))}
        </div>

        <div
          onClick={handleFaceClick}
          className={`flex-1 flex flex-col justify-center gap-3 rounded-xl border border-dashed border-white/10 p-3 ${
            selection && (selection.kind === "attacker" || (selection.kind === "spell" && selection.needsFace))
              ? "ring-2 ring-rose-400 cursor-pointer"
              : ""
          }`}
        >
          <div className="flex gap-2 justify-center flex-wrap min-h-[7rem]">
            {game.opponent.board.map((c) => (
              <GameCard key={c.instanceId} card={c} onClick={() => handleEnemyCreatureClick(c.instanceId)} targetable={!!selection} />
            ))}
          </div>
          <div className="border-t border-white/5" />
          <div className="flex gap-2 justify-center flex-wrap min-h-[7rem]">
            {game.me.board.map((c) => (
              <GameCard
                key={c.instanceId}
                card={c}
                disabled={c.summoningSick || c.hasAttacked}
                selected={selection?.kind === "attacker" && selection.instanceId === c.instanceId}
                onClick={() => handleMyCreatureClick(c.instanceId)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-end justify-center gap-2 min-h-[8rem]">
          {game.me.hand.map(
            (c) =>
              c && (
                <GameCard
                  key={c.instanceId}
                  card={c}
                  size="md"
                  disabled={!isMyTurn || c.cost > game.me.energy}
                  selected={selection?.kind === "spell" && selection.instanceId === c.instanceId}
                  onClick={() => handleHandClick(c.instanceId)}
                />
              )
          )}
        </div>

        <PlayerBar label={user?.displayName ?? "Vos"} life={game.me.life} energy={game.me.energy} maxEnergy={game.me.maxEnergy} />

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40 truncate max-w-md">{game.log[game.log.length - 1]}</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={() => sendAction({ type: "END_TURN" })}
            disabled={!isMyTurn}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-30"
          >
            {isMyTurn ? "Terminar turno" : "Turno del rival"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-arcane-500 flex items-center justify-center mx-auto mb-5 shadow-md">
        <Icon name="swords" size={28} className="text-white" />
      </div>
      <h1 className="text-xl font-bold mb-1">Modo Batalla</h1>
      <p className="text-sm text-white/50 mb-8">Elegí un mazo de 30 cartas y buscá rival en tiempo real.</p>

      {decks.length === 0 ? (
        <p className="text-sm text-white/40">Necesitás al menos un mazo completo (30 cartas) para jugar.</p>
      ) : status === "idle" ? (
        <div className="card-surface p-6 flex flex-col gap-4">
          <select className="input-field" value={deckId} onChange={(e) => setDeckId(e.target.value)}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button onClick={joinQueue} className="btn-primary py-2.5">
            Buscar partida
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="card-surface p-8 flex flex-col items-center gap-4">
          <Icon name="loader" size={28} className="animate-spin text-arcane-400" />
          <p className="text-sm text-white/60">Buscando rival...</p>
          <button onClick={leaveQueue} className="btn-ghost px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerBar({ label, life, energy, maxEnergy }: { label: string; life: number; energy: number; maxEnergy: number }) {
  return (
    <div className="flex items-center justify-between px-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm">
          <Icon name="heartFilled" size={16} filled className="text-rose-400" />
          {life}
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <Icon name="bolt" size={16} filled className="text-sky-300" />
          {energy}/{maxEnergy}
        </span>
      </div>
    </div>
  );
}
