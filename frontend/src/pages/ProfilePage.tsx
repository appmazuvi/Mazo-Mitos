import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { Icon } from "../components/Icon";

interface ProfileData {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
  _count: { followers: number; following: number; posts: number };
}

export function ProfilePage() {
  const { username } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [following, setFollowing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!username) return;
    api.get<ProfileData>(`/api/users/${username}`).then((p) => {
      setProfile(p);
      setBio(p.bio ?? "");
      setDisplayName(p.displayName ?? "");
    });
  }, [username]);

  async function toggleFollow() {
    if (!username) return;
    setFollowing(!following);
    if (following) await api.delete(`/api/users/${username}/follow`);
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

  if (!profile) return <div className="p-8 text-white/40 text-sm">Cargando...</div>;

  const isMe = user?.username === profile.username;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="card-frame p-6" style={{ ["--frame-color" as string]: profile.role === "ADMIN" ? "#e8b64c" : "#6a5a8a" }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-arcane-800 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden font-display">
              {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : (profile.displayName ?? profile.username)[0].toUpperCase()}
            </div>
            {isMe && (
              <ImageUploadButton
                onUploaded={handleAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-arcane-500 flex items-center justify-center border-2 border-[var(--bg-card)]"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold font-display truncate">{profile.displayName ?? profile.username}</p>
              {profile.role === "ADMIN" && <Icon name="crown" size={16} className="text-amber-300 shrink-0" />}
            </div>
            <p className="text-sm text-white/40">@{profile.username}</p>
          </div>
          {isMe ? (
            <button onClick={() => setEditing((e) => !e)} className="btn-ghost px-4 py-2 text-sm">
              {editing ? "Cancelar" : "Editar"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/mensajes/${profile.username}`)} className="btn-ghost px-3 py-2 text-sm">
                <Icon name="message" size={16} />
              </button>
              <button onClick={toggleFollow} className={following ? "btn-ghost px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}>
                {following ? "Siguiendo" : "Seguir"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-4 flex flex-col gap-3">
            <input className="input-field text-sm" placeholder="Nombre a mostrar" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <textarea className="input-field text-sm" rows={3} placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} />
            <button onClick={saveProfile} className="btn-primary py-2 text-sm self-start px-5">
              Guardar
            </button>
          </div>
        ) : (
          profile.bio && <p className="text-sm text-white/70 mt-4">{profile.bio}</p>
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
  );
}
