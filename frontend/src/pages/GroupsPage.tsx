import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "../components/Icon";
import type { Group } from "../types";

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load(q?: string) {
    api.get<Group[]>(`/api/groups${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setGroups);
  }
  useEffect(() => load(), []);
  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const group = await api.post<Group>("/api/groups", { name, description: description || undefined });
      setCreating(false);
      setName("");
      setDescription("");
      setGroups((g) => [group, ...g]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el grupo");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-display">Grupos</h1>
        <button onClick={() => setCreating((c) => !c)} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <Icon name="plus" size={16} />
          Nuevo grupo
        </button>
      </div>

      {creating && (
        <form onSubmit={createGroup} className="card-surface p-4 mb-6 flex flex-col gap-3">
          <input className="input-field text-sm" placeholder="Nombre del grupo" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          <textarea className="input-field text-sm" placeholder="Descripción (opcional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" className="btn-primary py-2 text-sm self-start px-5">
            Crear
          </button>
        </form>
      )}

      <input className="input-field w-full mb-6 text-sm" placeholder="Buscar grupo..." value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Link key={g.id} to={`/grupos/${g.slug}`} className="card-surface p-4 hover:-translate-y-0.5 transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-arcane-800 flex items-center justify-center font-display font-bold shrink-0 overflow-hidden">
                {g.avatarUrl ? <img src={g.avatarUrl} className="w-full h-full object-cover" /> : <Icon name="shield" size={20} />}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{g.name}</p>
                <p className="text-xs text-white/40">{g._count.members} miembros · {g._count.posts} posts</p>
              </div>
            </div>
            {g.description && <p className="text-xs text-white/50 mt-3 line-clamp-2">{g.description}</p>}
          </Link>
        ))}
        {groups.length === 0 && <p className="text-sm text-white/40">No hay grupos todavía. ¡Creá el primero!</p>}
      </div>
    </div>
  );
}
