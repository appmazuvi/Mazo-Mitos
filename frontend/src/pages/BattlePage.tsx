import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../lib/AuthContext";
import { sfx } from "../lib/sfx";
import { GameCard, type CardPulse } from "../components/GameCard";
import { Icon } from "../components/Icon";
import { DiceRoll, rollDiceForTotal } from "../components/DiceRoll";
import { AmbientFX, type AmbientTheme } from "../components/AmbientFX";
import type { CardInstance, Deck, GameStateView } from "../types";

function themeForEffect(effectKey: string | null | undefined): AmbientTheme {
  if (!effectKey) return null;
  if (effectKey.startsWith("DAMAGE") || effectKey.startsWith("AOE_DAMAGE")) return "fuego";
  if (effectKey.startsWith("HEAL")) return "lluvia";
  if (effectKey.startsWith("DRAW") || effectKey === "CHARGE") return "viento";
  if (effectKey.startsWith("BUFF") || effectKey === "TAUNT") return "tierra";
  if (effectKey === "DESTROY_TARGET" || effectKey === "LIFESTEAL") return "vacio";
  return null;
}

const TARGETED_SPELLS = ["DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6", "BUFF_ATTACK_2", "DESTROY_TARGET"];
const FACE_TARGETABLE = ["DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6"];
const OWN_ONLY = ["BUFF_ATTACK_2"];

type Selection =
  | { kind: "attacker"; instanceId: string }
  | { kind: "spell"; instanceId: string; needsFace: boolean; ownOnly: boolean }
  | null;

let pulseSeq = 0;
const nextPulseKey = () => pulseSeq++;

export function BattlePage() {
  const { user, token } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "queued" | "playing">("idle");
  const [game, setGame] = useState<GameStateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  const [cardPulses, setCardPulses] = useState<Record<string, CardPulse>>({});
  const [lifePulses, setLifePulses] = useState<{ me: CardPulse | null; opponent: CardPulse | null }>({ me: null, opponent: null });
  const [attackingIds, setAttackingIds] = useState<Set<string>>(new Set());
  const [diceRoll, setDiceRoll] = useState<{ dice: number[]; bonus: number; key: number } | null>(null);
  const [ambientTheme, setAmbientTheme] = useState<AmbientTheme>(null);
  const ambientTimeoutRef = useRef<number | null>(null);

  function triggerAmbient(theme: AmbientTheme) {
    if (!theme) return;
    setAmbientTheme(theme);
    if (ambientTimeoutRef.current) window.clearTimeout(ambientTimeoutRef.current);
    ambientTimeoutRef.current = window.setTimeout(() => setAmbientTheme(null), 5000);
  }
  const [turnBanner, setTurnBanner] = useState<{ text: string; key: number } | null>(null);
  const prevGameRef = useRef<GameStateView | null>(null);
  const outcomePlayedRef = useRef(false);

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

  // ---- Motor de animación/sonido: compara el estado anterior con el nuevo ----
  useEffect(() => {
    if (!game || !user) return;
    const prev = prevGameRef.current;

    if (prev && prev.matchId === game.matchId) {
      if (prev.turnPlayerId !== game.turnPlayerId) {
        const mine = game.turnPlayerId === user.id;
        setTurnBanner({ text: mine ? "¡TU TURNO!" : "TURNO DEL RIVAL", key: nextPulseKey() });
        sfx.turnStart();
        setTimeout(() => setTurnBanner(null), 1500);
      }

      diffLife("me", prev.me.life, game.me.life);
      diffLife("opponent", prev.opponent.life, game.opponent.life);
      diffBoard(prev.me.board, game.me.board);
      diffBoard(prev.opponent.board, game.opponent.board);

      if (game.me.hand.length < prev.me.hand.length || game.opponent.hand.length < prev.opponent.hand.length) sfx.cardPlay();
      if (game.me.hand.length > prev.me.hand.length) sfx.cardDraw();
    }

    prevGameRef.current = game;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  useEffect(() => {
    if (!game || game.phase !== "FINISHED" || outcomePlayedRef.current) return;
    outcomePlayedRef.current = true;
    if (game.winnerId === user?.id) sfx.victory();
    else sfx.defeat();
  }, [game, user]);

  function diffLife(who: "me" | "opponent", before: number, after: number) {
    if (after === before) return;
    const delta = after - before;
    setLifePulses((p) => ({ ...p, [who]: { key: nextPulseKey(), type: delta < 0 ? "damage" : "heal", value: Math.abs(delta) } }));
    if (delta < 0) sfx.impact();
    else sfx.heal();
    setTimeout(() => setLifePulses((p) => ({ ...p, [who]: null })), 900);
  }

  function diffBoard(before: CardInstance[], after: CardInstance[]) {
    const beforeMap = new Map(before.map((c) => [c.instanceId, c]));
    for (const c of after) {
      const prevCard = beforeMap.get(c.instanceId);
      if (!prevCard || prevCard.currentHealth == null || c.currentHealth == null) continue;
      if (c.currentHealth === prevCard.currentHealth) continue;
      const delta = c.currentHealth - prevCard.currentHealth;
      const id = c.instanceId;
      setCardPulses((p) => ({ ...p, [id]: { key: nextPulseKey(), type: delta < 0 ? "damage" : "heal", value: Math.abs(delta) } }));
      setTimeout(() => setCardPulses((p) => { const n = { ...p }; delete n[id]; return n; }), 900);
    }
  }

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

  function sendAttack(attackerInstanceId: string, targetInstanceId: string) {
    const attacker = game?.me.board.find((c) => c.instanceId === attackerInstanceId);
    if (attacker?.attack) {
      const rollKey = nextPulseKey();
      const { dice, bonus } = rollDiceForTotal(attacker.attack);
      setDiceRoll({ dice, bonus, key: rollKey });
      setTimeout(() => setDiceRoll((d) => (d?.key === rollKey ? null : d)), 750);
      triggerAmbient(themeForEffect(attacker.effectKey));
    }
    setAttackingIds((s) => new Set(s).add(attackerInstanceId));
    sfx.attack();
    setTimeout(() => {
      setAttackingIds((s) => {
        const n = new Set(s);
        n.delete(attackerInstanceId);
        return n;
      });
    }, 420);
    sendAction({ type: "ATTACK", attackerInstanceId, targetInstanceId });
  }

  const isMyTurn = game?.turnPlayerId === user?.id;

  function handleHandClick(instanceId: string) {
    if (!isMyTurn || !game) return;
    const card = game.me.hand.find((c) => c?.instanceId === instanceId);
    if (!card) return;

    triggerAmbient(themeForEffect(card.effectKey));

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
      sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId, targetInstanceId: instanceId });
      return;
    }
    if (!isMyTurn) return;
    const creature = game.me.board.find((c) => c.instanceId === instanceId);
    if (!creature || creature.summoningSick || creature.hasAttacked) return;
    if (selection?.kind === "attacker" && selection.instanceId === instanceId) {
      setSelection(null);
      return;
    }
    sfx.click();
    setSelection({ kind: "attacker", instanceId });
  }

  function handleEnemyCreatureClick(instanceId: string) {
    if (!selection) return;
    if (selection.kind === "attacker") {
      sendAttack(selection.instanceId, instanceId);
    } else if (selection.kind === "spell" && !selection.ownOnly) {
      sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId, targetInstanceId: instanceId });
    }
  }

  function handleFaceClick() {
    if (!selection) return;
    if (selection.kind === "attacker") {
      sendAttack(selection.instanceId, "FACE");
    } else if (selection.kind === "spell" && selection.needsFace) {
      sendAction({ type: "PLAY_CARD", instanceId: selection.instanceId });
    }
  }

  const winnerLabel = useMemo(() => {
    if (!game || game.phase !== "FINISHED") return null;
    return game.winnerId === user?.id;
  }, [game, user]);

  if (status === "playing" && game) {
    return (
      <div className="h-app-screen flex flex-col p-4 gap-3 overflow-hidden battle-table relative">
        <AmbientFX theme={ambientTheme} />

        <AnimatePresence>{diceRoll && <DiceRoll key={diceRoll.key} dice={diceRoll.dice} bonus={diceRoll.bonus} />}</AnimatePresence>

        <AnimatePresence>
          {turnBanner && (
            <motion.div
              key={turnBanner.key}
              initial={{ opacity: 0, y: -30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
              <div
                className="px-8 py-3 rounded-full font-thematic font-bold text-lg tracking-wider text-white border"
                style={{
                  background: turnBanner.text.startsWith("¡TU") ? "linear-gradient(180deg,#f4d78a,#e8b64c)" : "rgba(19,15,31,0.9)",
                  color: turnBanner.text.startsWith("¡TU") ? "#2a1a05" : "#fff",
                  borderColor: turnBanner.text.startsWith("¡TU") ? "rgba(255,224,150,0.7)" : "rgba(199,168,255,0.3)",
                  boxShadow: turnBanner.text.startsWith("¡TU") ? "0 0 30px rgba(232,182,76,0.5)" : "0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                {turnBanner.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {winnerLabel !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="card-frame p-10 text-center relative overflow-hidden"
                style={{ ["--frame-color" as string]: winnerLabel ? "#e8b64c" : "#a86a1c" }}
              >
                {winnerLabel && (
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{ background: "radial-gradient(circle at 50% 30%, rgba(232,182,76,0.5), transparent 60%)" }}
                  />
                )}
                <div className="relative">
                  <Icon name={winnerLabel ? "crown" : "skull" as any} size={40} className={winnerLabel ? "text-amber-300 mx-auto mb-3" : "text-white/40 mx-auto mb-3"} />
                  <p className="text-2xl font-bold font-thematic mb-2">{winnerLabel ? "¡Victoria!" : "Derrota"}</p>
                  <p className="text-sm text-white/50 mb-6">{winnerLabel ? "Dominaste el multiverso de Aralon." : "El multiverso te espera para revancha."}</p>
                  <button
                    className={winnerLabel ? "btn-gold px-6 py-2.5" : "btn-primary px-6 py-2.5"}
                    onClick={() => {
                      setGame(null);
                      setStatus("idle");
                      outcomePlayedRef.current = false;
                      prevGameRef.current = null;
                    }}
                  >
                    Volver al lobby
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <PlayerBar label="Rival" life={game.opponent.life} energy={game.opponent.energy} maxEnergy={game.opponent.maxEnergy} pulse={lifePulses.opponent} />

        <div className="flex gap-1 justify-center flex-wrap min-h-[3.5rem]">
          <AnimatePresence>
            {game.opponent.hand.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -20, rotate: -8 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="w-10 h-14 rounded-md bg-arcane-900 border border-arcane-700"
              />
            ))}
          </AnimatePresence>
        </div>

        <div
          onClick={handleFaceClick}
          className={`flex-1 flex flex-col justify-center gap-3 rounded-xl border border-dashed border-white/10 p-3 transition ${
            selection && (selection.kind === "attacker" || (selection.kind === "spell" && selection.needsFace))
              ? "ring-2 ring-rose-400 cursor-pointer"
              : ""
          }`}
        >
          <div className="flex gap-2 justify-center flex-wrap min-h-[7rem]">
            <AnimatePresence>
              {game.opponent.board.map((c) => (
                <GameCard
                  key={c.instanceId}
                  card={c}
                  onClick={() => handleEnemyCreatureClick(c.instanceId)}
                  targetable={!!selection}
                  attacking={attackingIds.has(c.instanceId)}
                  pulse={cardPulses[c.instanceId]}
                />
              ))}
            </AnimatePresence>
          </div>
          <div className="border-t border-white/5" />
          <div className="flex gap-2 justify-center flex-wrap min-h-[7rem]">
            <AnimatePresence>
              {game.me.board.map((c) => (
                <GameCard
                  key={c.instanceId}
                  card={c}
                  disabled={c.summoningSick || c.hasAttacked}
                  selected={selection?.kind === "attacker" && selection.instanceId === c.instanceId}
                  attacking={attackingIds.has(c.instanceId)}
                  pulse={cardPulses[c.instanceId]}
                  onClick={() => handleMyCreatureClick(c.instanceId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-end justify-center gap-2 min-h-[8rem]">
          <AnimatePresence>
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
          </AnimatePresence>
        </div>

        <PlayerBar label={user?.displayName ?? "Vos"} life={game.me.life} energy={game.me.energy} maxEnergy={game.me.maxEnergy} pulse={lifePulses.me} />

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40 truncate max-w-md">{game.log[game.log.length - 1]}</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              sfx.click();
              sendAction({ type: "END_TURN" });
            }}
            disabled={!isMyTurn}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-30"
          >
            {isMyTurn ? "Terminar turno" : "Turno del rival"}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-arcane-500 flex items-center justify-center mx-auto mb-5 shadow-md">
        <Icon name="swords" size={28} className="text-white" />
      </div>
      <h1 className="text-xl font-bold font-thematic mb-1">Modo Batalla</h1>
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

function PlayerBar({ label, life, energy, maxEnergy, pulse }: { label: string; life: number; energy: number; maxEnergy: number; pulse?: CardPulse | null }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl glass-panel">
      <span className="text-sm font-semibold font-thematic">{label}</span>
      <div className="flex items-center gap-4">
        <span className={`relative flex items-center gap-1.5 text-sm ${pulse ? "life-pulse" : ""} ${pulse?.type === "damage" ? "stat-flash-dmg" : pulse?.type === "heal" ? "stat-flash-heal" : ""}`} key={pulse?.key ?? "life"}>
          <Icon name="heartFilled" size={16} filled className="text-rose-400" />
          {life}
          <AnimatePresence>
            {pulse && (
              <motion.span
                key={pulse.key}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -18 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`absolute -top-1 left-6 font-thematic font-bold text-sm pointer-events-none ${pulse.type === "damage" ? "text-red-400" : "text-emerald-300"}`}
              >
                {pulse.type === "damage" ? `-${pulse.value}` : `+${pulse.value}`}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <Icon name="bolt" size={16} filled className="text-sky-300" />
          {energy}/{maxEnergy}
        </span>
      </div>
    </div>
  );
}
