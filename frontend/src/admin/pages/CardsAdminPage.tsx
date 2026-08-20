import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Icon } from "../../components/Icon";
import type { Card } from "../../types";

const EMPTY: Omit<Card, "id"> = {
  name: "",
  cost: 1,
  type: "CREATURE",
  attack: 1,
  health: 1,
  rarity: "COMUN",
  effectKey: null,
  description: "",
  imageUrl: null,
};

const EFFECTS = ["", "TAUNT", "CHARGE", "LIFESTEAL", "DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6", "AOE_DAMAGE_2", "HEAL_4", "HEAL_8", "DRAW_2", "BUFF_ATTACK_2", "DESTROY_TARGET"];

export function CardsAdminPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [editing, setEditing] = useState<Card | (Omit<Card, "id"> & { id?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<Card[]>("/api/cards").then(setCards);
  }
  useEffect(load, []);

  async function save() {
    if (!editing) return;
    setError(null);
    const payload = {
      ...editing,
      cost: Number(editing.cost),
      attack: editing.type === "CREATURE" ? Number(editing.attack ?? 0) : null,
      health: editing.type === "CREATURE" ? Number(editing.health ?? 1) : null,
      effectKey: editing.effectKey || null,
    };
    try {
      if ("id" in editing && editing.id) {
        await api.put(`/api/admin/cards/${editing.id}`, payload);
      } else {
        await api.post("/api/admin/cards", payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta carta? Se quitará de todos los mazos que la usen.")) return;
    await api.delete(`/api/admin/cards/${id}`);
    load();
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-display">Cartas</h1>
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <Icon name="plus" size={16} />
            Nueva carta
          </button>
        </div>

        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/40 border-b border-white/5">
                <th className="p-3">Nombre</th>
                <th className="p-3">Costo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Rareza</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.cost}</td>
                  <td className="p-3 text-white/60">{c.type === "CREATURE" ? "Criatura" : "Hechizo"}</td>
                  <td className="p-3 text-white/60">{c.rarity}</td>
                  <td className="p-3 flex gap-2 justify-end">
                    <button onClick={() => setEditing(c)} className="text-white/40 hover:text-white/80">
                      <Icon name="edit" size={15} />
                    </button>
                    <button onClick={() => remove(c.id)} className="text-white/40 hover:text-red-400">
                      <Icon name="x" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="card-surface p-5 h-fit sticky top-8">
          <p className="font-display font-semibold mb-4">{"id" in editing && editing.id ? "Editar carta" : "Nueva carta"}</p>
          <div className="flex flex-col gap-3">
            <Field label="Nombre">
              <input className="input-field w-full" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Costo">
                <input type="number" className="input-field w-full" value={editing.cost} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })} />
              </Field>
              <Field label="Tipo">
                <select className="input-field w-full" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value as Card["type"] })}>
                  <option value="CREATURE">Criatura</option>
                  <option value="SPELL">Hechizo</option>
                </select>
              </Field>
            </div>
            {editing.type === "CREATURE" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ataque">
                  <input type="number" className="input-field w-full" value={editing.attack ?? 0} onChange={(e) => setEditing({ ...editing, attack: Number(e.target.value) })} />
                </Field>
                <Field label="Vida">
                  <input type="number" className="input-field w-full" value={editing.health ?? 1} onChange={(e) => setEditing({ ...editing, health: Number(e.target.value) })} />
                </Field>
              </div>
            )}
            <Field label="Rareza">
              <select className="input-field w-full" value={editing.rarity} onChange={(e) => setEditing({ ...editing, rarity: e.target.value as Card["rarity"] })}>
                <option value="COMUN">Común</option>
                <option value="RARA">Rara</option>
                <option value="EPICA">Épica</option>
                <option value="LEGENDARIA">Legendaria</option>
              </select>
            </Field>
            <Field label="Efecto/palabra clave">
              <select className="input-field w-full" value={editing.effectKey ?? ""} onChange={(e) => setEditing({ ...editing, effectKey: e.target.value || null })}>
                {EFFECTS.map((e) => (
                  <option key={e} value={e}>
                    {e || "Ninguno"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descripción">
              <textarea className="input-field w-full" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 mt-2">
              <button onClick={save} className="btn-primary flex-1 py-2.5 text-sm">
                Guardar
              </button>
              <button onClick={() => setEditing(null)} className="btn-ghost px-4 py-2.5 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</span>
      {children}
    </label>
  );
}
