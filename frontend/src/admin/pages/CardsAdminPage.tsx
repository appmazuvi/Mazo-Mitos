import { useEffect, useMemo, useRef, useState } from "react";
import { api, API_URL } from "../../lib/api";
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
  set: null,
  code: null,
};

const EFFECTS = ["", "TAUNT", "CHARGE", "LIFESTEAL", "DAMAGE_2", "DAMAGE_3", "DAMAGE_4", "DAMAGE_6", "AOE_DAMAGE_2", "HEAL_4", "HEAL_8", "DRAW_2", "BUFF_ATTACK_2", "DESTROY_TARGET"];

const CSV_TEMPLATE = `name,cost,type,attack,health,rarity,effectKey,description,set,code,imageUrl
Recluta de Ignis,1,CREATURE,1,2,COMUN,,Un joven soldado de las llamas.,Batalla 2,B2-001,
Bola de Fuego,4,SPELL,,,RARA,DAMAGE_4,Inflige 4 de daño a un objetivo.,Batalla 2,B2-002,
`;

const JSON_TEMPLATE = JSON.stringify(
  [
    {
      name: "Recluta de Ignis",
      cost: 1,
      type: "CREATURE",
      attack: 1,
      health: 2,
      rarity: "COMUN",
      effectKey: null,
      description: "Un joven soldado de las llamas.",
      set: "Batalla 2",
      code: "B2-001",
      imageUrl: null,
    },
    {
      name: "Bola de Fuego",
      cost: 4,
      type: "SPELL",
      rarity: "RARA",
      effectKey: "DAMAGE_4",
      description: "Inflige 4 de daño a un objetivo.",
      set: "Batalla 2",
      code: "B2-002",
    },
  ],
  null,
  2
);

interface BulkResult {
  created: number;
  updated: number;
  errors: { row: number; name?: string; error: string }[];
}

interface ImageBulkResult {
  matched: string[];
  unmatched: string[];
  failed: { file: string; error: string }[];
}

function normalizeForMatch(s: string) {
  return s
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase();
}

export function CardsAdminPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [editing, setEditing] = useState<Card | (Omit<Card, "id"> & { id?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setFilter, setSetFilter] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [batchSet, setBatchSet] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgResult, setImgResult] = useState<ImageBulkResult | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [artUploading, setArtUploading] = useState(false);
  const [renaming, setRenaming] = useState(false);

  function load() {
    api.get<Card[]>("/api/cards").then(setCards);
  }
  useEffect(load, []);

  const sets = useMemo(() => {
    const unique = new Set(cards.map((c) => c.set).filter((s): s is string => !!s));
    return [...unique].sort();
  }, [cards]);

  const filteredCards = setFilter ? cards.filter((c) => c.set === setFilter) : cards;

  async function save() {
    if (!editing) return;
    setError(null);
    const payload = {
      ...editing,
      cost: Number(editing.cost),
      attack: editing.type === "CREATURE" ? Number(editing.attack ?? 0) : null,
      health: editing.type === "CREATURE" ? Number(editing.health ?? 1) : null,
      effectKey: editing.effectKey || null,
      set: editing.set?.trim() || null,
      code: editing.code?.trim() || null,
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

  function downloadTemplate(kind: "csv" | "json") {
    const content = kind === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE;
    const type = kind === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8";
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kind === "csv" ? "plantilla-cartas.csv" : "plantilla-cartas.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadCsv(file: File) {
    setUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const token = localStorage.getItem("cartaverso_token");
      const form = new FormData();
      form.append("file", file);
      if (batchSet.trim()) form.append("defaultSet", batchSet.trim());
      const res = await fetch(`${API_URL}/api/admin/cards/bulk`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error al subir el archivo");
      setBulkResult(body as BulkResult);
      load();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function renameSet(oldName: string) {
    const newName = prompt(`Nuevo nombre para la colección "${oldName}":`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    setRenaming(true);
    try {
      const toRename = cards.filter((c) => c.set === oldName);
      for (const c of toRename) {
        await api.put(`/api/admin/cards/${c.id}`, { set: newName.trim() });
      }
      load();
    } finally {
      setRenaming(false);
    }
  }

  async function uploadArtFile(file: File) {
    if (!editing) return;
    setArtUploading(true);
    setError(null);
    try {
      const { url } = await api.upload<{ url: string }>("/api/uploads/image", file);
      setEditing((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setArtUploading(false);
    }
  }

  async function uploadImagesBulk(files: FileList) {
    setImgUploading(true);
    setImgResult(null);
    const byName = new Map(cards.map((c) => [normalizeForMatch(c.name), c]));
    const matched: string[] = [];
    const unmatched: string[] = [];
    const failed: { file: string; error: string }[] = [];

    for (const file of Array.from(files)) {
      const card = byName.get(normalizeForMatch(file.name));
      if (!card) {
        unmatched.push(file.name);
        continue;
      }
      try {
        const { url } = await api.upload<{ url: string }>("/api/uploads/image", file);
        await api.put(`/api/admin/cards/${card.id}`, { imageUrl: url });
        matched.push(card.name);
      } catch (err) {
        failed.push({ file: file.name, error: err instanceof Error ? err.message : "Error al subir" });
      }
    }

    setImgResult({ matched, unmatched, failed });
    setImgUploading(false);
    if (imgInputRef.current) imgInputRef.current.value = "";
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

        <div className="card-surface p-4 mb-5">
          <p className="text-sm font-semibold mb-1">Carga masiva por archivo</p>
          <p className="text-xs text-white/40 mb-3">
            Subí un CSV o JSON con las columnas/campos name, cost, type, attack, health, rarity, effectKey, description, set, code,
            imageUrl — también podés usarlos en español (nombre, costo, tipo, fuerza, vida, rareza, habilidad, descripcion, coleccion).
            Si el nombre de una carta ya existe, se actualiza en vez de duplicarse.
          </p>
          <Field label="Nombre de colección para este lote (opcional)">
            <input
              className="input-field w-full text-sm mb-3"
              placeholder='Ej. "Colección de cartas 2" — se usa si el archivo no trae set/edition'
              value={batchSet}
              onChange={(e) => setBatchSet(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => downloadTemplate("csv")} className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5">
              <Icon name="image" size={14} />
              Plantilla CSV
            </button>
            <button onClick={() => downloadTemplate("json")} className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5">
              <Icon name="image" size={14} />
              Plantilla JSON
            </button>
            <label className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer">
              <Icon name={uploading ? "loader" : "send"} size={14} className={uploading ? "animate-spin" : ""} />
              {uploading ? "Subiendo..." : "Subir archivo"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,.json,application/json"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCsv(file);
                }}
              />
            </label>
          </div>

          {bulkError && <p className="text-xs text-red-400 mt-3">{bulkError}</p>}
          {bulkResult && (
            <div className="mt-3 text-xs">
              <p className="text-emerald-400">
                {bulkResult.created} carta{bulkResult.created === 1 ? "" : "s"} creada{bulkResult.created === 1 ? "" : "s"}, {bulkResult.updated}{" "}
                actualizada{bulkResult.updated === 1 ? "" : "s"}.
              </p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-amber-300">{bulkResult.errors.length} fila(s) con problemas:</p>
                  {bulkResult.errors.map((e, i) => (
                    <p key={i} className="text-white/50">
                      Fila {e.row}{e.name ? ` (${e.name})` : ""}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card-surface p-4 mb-5">
          <p className="text-sm font-semibold mb-1">Subir diseños de carta en lote</p>
          <p className="text-xs text-white/40 mb-3">
            Elegí varias imágenes a la vez (por ejemplo, exportadas de Canva). Cada archivo se asigna automáticamente a la carta cuyo
            nombre coincida con el nombre del archivo — "Recluta de Ignis.png" se asigna a la carta "Recluta de Ignis". Primero creá las
            cartas (a mano o por CSV) y después subí acá el arte.
          </p>
          <label className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer w-fit">
            <Icon name={imgUploading ? "loader" : "image"} size={14} className={imgUploading ? "animate-spin" : ""} />
            {imgUploading ? "Subiendo..." : "Elegir imágenes"}
            <input
              ref={imgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              disabled={imgUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) uploadImagesBulk(e.target.files);
              }}
            />
          </label>

          {imgResult && (
            <div className="mt-3 text-xs flex flex-col gap-1.5">
              {imgResult.matched.length > 0 && (
                <p className="text-emerald-400">
                  Asignadas: {imgResult.matched.join(", ")}
                </p>
              )}
              {imgResult.failed.length > 0 && (
                <div>
                  <p className="text-red-400">Fallaron:</p>
                  {imgResult.failed.map((f, i) => (
                    <p key={i} className="text-white/50">{f.file}: {f.error}</p>
                  ))}
                </div>
              )}
              {imgResult.unmatched.length > 0 && (
                <div>
                  <p className="text-amber-300">Sin carta coincidente (revisá que el nombre del archivo sea igual al nombre de la carta):</p>
                  {imgResult.unmatched.map((f, i) => (
                    <p key={i} className="text-white/50">{f}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {sets.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-white/40">Colección:</span>
            <select className="input-field text-xs py-1.5" value={setFilter} onChange={(e) => setSetFilter(e.target.value)}>
              <option value="">Todas</option>
              {sets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {setFilter && (
              <button
                onClick={() => renameSet(setFilter)}
                disabled={renaming}
                className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
              >
                <Icon name="edit" size={12} />
                Renombrar
              </button>
            )}
          </div>
        )}

        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-white/40 border-b border-white/5">
                <th className="p-3">Nombre</th>
                <th className="p-3">Colección</th>
                <th className="p-3">Costo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Rareza</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-white/40">{c.set ?? "—"}</td>
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
              <Field label="Colección">
                <input
                  className="input-field w-full"
                  list="set-options"
                  placeholder="Ej. Batalla 2"
                  value={editing.set ?? ""}
                  onChange={(e) => setEditing({ ...editing, set: e.target.value })}
                />
                <datalist id="set-options">
                  {sets.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Código (opcional)">
                <input
                  className="input-field w-full"
                  placeholder="Ej. B2-001"
                  value={editing.code ?? ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                />
              </Field>
            </div>
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
            <Field label="Arte de la carta">
              <div className="flex items-center gap-3">
                {editing.imageUrl ? (
                  <img src={editing.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/10" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/20">
                    <Icon name="image" size={20} />
                  </div>
                )}
                <label className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer">
                  <Icon name={artUploading ? "loader" : "image"} size={14} className={artUploading ? "animate-spin" : ""} />
                  {artUploading ? "Subiendo..." : editing.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={artUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadArtFile(file);
                    }}
                  />
                </label>
              </div>
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
