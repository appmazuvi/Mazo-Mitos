import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { api } from "../lib/api";
import { Icon } from "../components/Icon";
import type { Card } from "../types";

const SHOWCASE_NAMES = ["Ignareth, el Eterno", "Nayadel, Señora del Abismo", "Gaiathor, Corazón del Mundo", "Aerin, la Tempestad Viva", "Nyxandra, Devoradora de Mundos"];

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showcase, setShowcase] = useState<Card[]>([]);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Card[]>("/api/cards")
      .then((cards) => {
        const picked = SHOWCASE_NAMES.map((n) => cards.find((c) => c.name === n)).filter(Boolean) as Card[];
        setShowcase(picked.length ? picked : cards.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const rotations = [-14, -6, 0, 7, 15];
  const lifts = [10, -6, -16, -4, 8];

  return (
    <div className="min-h-screen lg:h-screen grid lg:grid-cols-[1.15fr_1fr]" style={{ background: "var(--bg)" }}>
      {/* Hero */}
      <div
        className="relative hidden lg:flex flex-col p-12 overflow-hidden"
        style={{
          background:
            "radial-gradient(900px 600px at 10% 0%, rgba(255,138,61,0.16), transparent 55%), radial-gradient(900px 600px at 90% 10%, rgba(95,212,255,0.14), transparent 55%), radial-gradient(1000px 800px at 50% 100%, rgba(201,139,255,0.2), transparent 60%), #0a0710",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5) 1px, transparent 0), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.4) 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "180px 180px" }} />

        <div className="relative flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-lg">
            <Icon name="bolt" size={24} className="text-white" />
          </div>
          <span className="text-3xl font-bold font-display tracking-wide">CartaVerso</span>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center gap-10 min-h-0">
          <div className="relative w-full max-w-md h-56 shrink-0">
            {showcase.map((card, i) => (
              <div
                key={card.id}
                className="card-frame absolute w-32 h-44 top-1/2 left-1/2 transition-transform duration-500"
                style={{
                  ["--frame-color" as string]:
                    card.rarity === "LEGENDARIA" ? "#e8b64c" : card.rarity === "EPICA" ? "#b06bff" : card.rarity === "RARA" ? "#4fa3ff" : "#9aa0b4",
                  transform: `translate(-50%, -50%) translateX(${(i - 2) * 74}px) translateY(${lifts[i]}px) rotate(${rotations[i]}deg)`,
                  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6)",
                  zIndex: i,
                }}
              >
                {card.imageUrl && <img src={card.imageUrl} className="w-full h-20 object-cover" alt="" />}
                <div className="p-2">
                  <p className="text-[11px] font-display font-semibold leading-tight">{card.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center max-w-sm">
            <h1 className="font-display text-3xl font-bold leading-tight mb-3">El multiverso de Aralon te espera.</h1>
            <p className="text-white/60 text-sm">
              Armá tu mazo, subí de rango y compartí tus victorias en la red social de cartas más épica.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-arcane-400 to-arcane-700 flex items-center justify-center shadow-md">
              <Icon name="bolt" size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-wide">CartaVerso</span>
          </div>

          <div className="card-frame p-7" style={{ ["--frame-color" as string]: "#e8b64c" }}>
            <h1 className="text-lg font-semibold font-display mb-1">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
            <p className="text-sm text-white/50 mb-6">
              {mode === "login" ? "Volvé al multiverso de Aralon." : "Uníte a la batalla de cartas."}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "login" ? (
                <Field label="Email o usuario">
                  <input className="input-field w-full" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
              ) : (
                <>
                  <Field label="Email">
                    <input
                      type="email"
                      className="input-field w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Usuario">
                    <input
                      className="input-field w-full"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      minLength={3}
                    />
                  </Field>
                </>
              )}
              <Field label="Contraseña">
                <input
                  type="password"
                  className="input-field w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </Field>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 mt-1 font-display tracking-wide">
                {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-white/50 mt-5">
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button
              className="text-amber-300 font-medium"
              onClick={() => {
                setError(null);
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Registrate" : "Iniciá sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-white/40">{label}</span>
      {children}
    </label>
  );
}
