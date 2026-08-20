import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

interface ProfileData {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  _count: { followers: number; following: number; posts: number };
}

export function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;
    api.get<ProfileData>(`/api/users/${username}`).then(setProfile);
  }, [username]);

  async function toggleFollow() {
    if (!username) return;
    setFollowing(!following);
    if (following) await api.delete(`/api/users/${username}/follow`);
    else await api.post(`/api/users/${username}/follow`);
  }

  if (!profile) return <div className="p-8 text-white/40 text-sm">Cargando...</div>;

  const isMe = user?.username === profile.username;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="card-surface p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-arcane-800 flex items-center justify-center text-xl font-bold shrink-0">
            {(profile.displayName ?? profile.username)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{profile.displayName ?? profile.username}</p>
            <p className="text-sm text-white/40">@{profile.username}</p>
          </div>
          {!isMe && (
            <button onClick={toggleFollow} className={following ? "btn-ghost px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}>
              {following ? "Siguiendo" : "Seguir"}
            </button>
          )}
        </div>

        {profile.bio && <p className="text-sm text-white/70 mt-4">{profile.bio}</p>}

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
