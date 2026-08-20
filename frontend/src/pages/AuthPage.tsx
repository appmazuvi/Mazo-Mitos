import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Icon } from "../components/Icon";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-arcane-500 flex items-center justify-center shadow-md">
            <Icon name="bolt" size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CartaVerso</span>
        </div>

        <div className="card-surface p-7">
          <h1 className="text-lg font-semibold mb-1">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
              {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/50 mt-5">
          {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
          <button
            className="text-arcane-400 font-medium"
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
