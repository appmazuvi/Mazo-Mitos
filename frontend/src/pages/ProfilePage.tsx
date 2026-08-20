import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { CardTile } from "../components/CardTile";
import { Icon } from "../components/Icon";
import type { ProfileData } from "../types";

export function ProfilePage() {
  const { username } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");

  function load() {
    if (!username) return;
    api.get<ProfileData>(`/api/users/${username}`).then((p) => {
      setProfile(p);
      setBio(p.bio ?? "");
      setDisplayName(p.displayName ?? "");
    });
  }
  useEffect(load, [username]);

  async function toggleFollow() {
    if (!username || !profile) return;
    const wasFollowing = profile.isFollowing;
    setProfile({ ...profile, isFollowing: !wasFollowing, _count: { ...profile._count, followers: profile._count.followers + (wasFollowing ? -1 : 1) } });
    if (wasFollowing) await api.delete(`/api/users/${username}/follow`);
    else await api.post(`/api/users/${username}/follow`);
  }

  async function saveProfile() {
    const updated = await api.put<{ avatarUrl?: string | null }>("/api/users/me", { bio, displayName });
    setProfile((p) => (p ? { ...p, bio, displayName } : p));
    updateUser({ displayName, bio, avatarUrl: updated.avatarUrl });
    setEditing(false);
  }

  async function handleAvatar(url: string) {
    await api.put("/api/users/me", { avatarUrl: url });
    setProfile((p) => (p ? { ...p, avatarUrl: url } : p));
    updateUser({ avatarUrl: url });
  }

  async function handleCover(url: string) {
    await api.put("/api/users/me", { coverUrl: url });
    setProfile((p) => (p ? { ...p, coverUrl: url } : p));
  }

  if (!profile) return <div className="p-8 text-white/40 text-sm">Cargando...</div>;

  const isMe = user?.username === profile.username;
  const winRate = profile.wins + profile.losses > 0 ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="card-frame overflow-hidden" style={{ ["--frame-color" as string]: profile.role === "ADMIN" ? "#e8b64c" : "#6a5a8a" }}>
        <div className="relative h-32 bg-gradient-to-br from-arcane-700 via-arcane-900 to-black">
          {profile.coverUrl && <img src={profile.coverUrl} className="absolute inset-0 w-full h-full object-cover" />}
          {isMe && <ImageUploadButton onUploaded={handleCover} className="absolute top-2 right-2 bg-black/50 p-2 rounded-lg" />}
        </div>

        <div className="p-6 pt-0">
          <div className="flex items-end justify-between -mt-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-arcane-800 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden font-display border-4 border-[var(--bg-card)]">
                {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : (profile.displayName ?? profile.username)[0].toUpperCase()}
              </div>
              {isMe && (
                <ImageUploadButton
                  onUploaded={handleAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-arcane-500 flex items-center justify-center border-2 border-[var(--bg-card)]"
                />
              )}
            </div>
            {isMe ? (
              <button onClick={() => setEditing((e) => !e)} className="btn-ghost px-4 py-2 text-sm">
                {editing ? "Cancelar" : "Editar perfil"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => navigate(`/mensajes/${profile.username}`)} className="btn-ghost px-3 py-2 text-sm">
                  <Icon name="message" size={16} />
                </button>
                <button onClick={toggleFollow} className={profile.isFollowing ? "btn-ghost px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}>
                  {profile.isFollowing ? "Siguiendo" : "Seguir"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <p className="text-lg font-bold font-display">{profile.displayName ?? profile.username}</p>
            {profile.role === "ADMIN" && <Icon name="crown" size={16} className="text-amber-300" />}
          </div>
          <p className="text-sm text-white/40">@{profile.username}</p>

          {editing ? (
            <div className="mt-4 flex flex-col gap-3">
              <input className="input-field text-sm" placeholder="Nombre a mostrar" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <textarea className="input-field text-sm" rows={3} placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} />
              <button onClick={saveProfile} className="btn-primary py-2 text-sm self-start px-5">
                Guardar
              </button>
            </div>
          ) : (
            profile.bio && <p className="text-sm text-white/70 mt-3">{profile.bio}</p>
          )}

          <div className="flex gap-6 mt-5 text-sm">
            <span>
              <strong>{profile._count.posts}</strong> <span className="text-white/40">posts</span>
            </span>
            <span>
              <strong>{profile._count.followers}</strong> <span className="text-white/40">seguidores</span>
            </span>
            <span>
              <strong>{profile._count.following}</strong> <span className="text-white/40">siguiendo</span>
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas competitivas */}
      <div className="grid grid-cols-4 gap-3 mt-6">
        <StatBox icon="gauge" label="Rating" value={profile.rating} accent="text-arcane-300" />
        <StatBox icon="crown" label="Rank" value={`#${profile.rank}`} accent="text-amber-300" />
        <StatBox icon="trophy" label="Victorias" value={profile.wins} accent="text-emerald-300" />
        <StatBox icon="swords" label="% Victoria" value={`${winRate}%`} accent="text-sky-300" />
      </div>

      {/* Logros */}
      <div className="card-surface p-5 mt-6">
        <p className="font-display font-semibold mb-4 flex items-center gap-2">
          <Icon name="medal" size={18} className="text-amber-300" />
          Logros ({profile.achievements.length})
        </p>
        {profile.achievements.length === 0 ? (
          <p className="text-sm text-white/40">Todavía sin logros desbloqueados.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profile.achievements.map((ua) => (
              <div key={ua.achievement.key} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5">
                <div className="w-9 h-9 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                  <Icon name={ua.achievement.icon as any} size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{ua.achievement.name}</p>
                  <p className="text-[10px] text-white/40 truncate">{ua.achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mazos destacados */}
      {profile.decks.length > 0 && (
        <div className="card-surface p-5 mt-6">
          <p className="font-display font-semibold mb-4 flex items-center gap-2">
            <Icon name="deck" size={18} className="text-arcane-300" />
            Mazos destacados
          </p>
          <div className="flex flex-col gap-4">
            {profile.decks.map((deck) => (
              <div key={deck.id}>
                <p className="text-sm font-medium mb-2">{deck.name}</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {deck.cards.slice(0, 6).map((dc) => (
                    <CardTile key={dc.id} card={dc.card} quantity={dc.quantity} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="card-surface p-3.5 flex flex-col items-center text-center">
      <Icon name={icon} size={18} className={accent} />
      <p className="text-lg font-bold font-display mt-1">{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
    </div>
  );
}
