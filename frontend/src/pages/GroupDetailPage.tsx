import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { PostCard } from "../components/PostCard";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/Loading";
import type { Group, Post } from "../types";

interface Member {
  id: string;
  role: string;
  user: { username: string; displayName?: string | null; avatarUrl?: string | null; rating: number };
}

export function GroupDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<"feed" | "members">("feed");
  const [content, setContent] = useState("");

  function load() {
    if (!slug) return;
    api.get<Group>(`/api/groups/${slug}`).then(setGroup);
    api.get<Post[]>(`/api/groups/${slug}/feed`).then(setPosts);
    api.get<Member[]>(`/api/groups/${slug}/members`).then(setMembers);
  }
  useEffect(load, [slug]);

  async function toggleMembership() {
    if (!group) return;
    if (group.isMember) await api.delete(`/api/groups/${slug}/join`);
    else await api.post(`/api/groups/${slug}/join`);
    setGroup((g) => (g ? { ...g, isMember: !g.isMember, _count: { ...g._count, members: g._count.members + (g.isMember ? -1 : 1) } } : g));
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !group) return;
    const post = await api.post<Post>("/api/posts", { content, groupId: group.id });
    setPosts((p) => [post, ...p]);
    setContent("");
  }

  if (!group) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="card-surface p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-arcane-800 flex items-center justify-center font-display font-bold text-xl shrink-0 overflow-hidden">
            {group.avatarUrl ? <img src={group.avatarUrl} className="w-full h-full object-cover" /> : <Icon name="shield" size={28} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold font-display truncate">{group.name}</p>
            <p className="text-xs text-white/40">
              {group._count.members} miembros · creado por {group.owner.displayName ?? group.owner.username}
            </p>
          </div>
          {group.owner.username !== user?.username && (
            <button onClick={toggleMembership} className={group.isMember ? "btn-ghost px-4 py-2 text-sm" : "btn-primary px-4 py-2 text-sm"}>
              {group.isMember ? "Miembro" : "Unirme"}
            </button>
          )}
        </div>
        {group.description && <p className="text-sm text-white/60 mt-4">{group.description}</p>}
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("feed")} className={`nav-pill px-3 py-2 text-sm font-medium ${tab === "feed" ? "active" : "text-white/60 border border-white/10"}`}>
          Publicaciones
        </button>
        <button onClick={() => setTab("members")} className={`nav-pill px-3 py-2 text-sm font-medium ${tab === "members" ? "active" : "text-white/60 border border-white/10"}`}>
          Miembros
        </button>
      </div>

      {tab === "feed" ? (
        <div className="flex flex-col gap-4">
          {group.isMember && (
            <form onSubmit={handlePost} className="card-surface p-4">
              <textarea
                className="input-field w-full resize-none text-sm"
                rows={2}
                placeholder={`Compartí algo con ${group.name}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!content.trim()}>
                  Publicar
                </button>
              </div>
            </form>
          )}
          {posts.length === 0 && <p className="text-sm text-white/40">Todavía no hay publicaciones en este grupo.</p>}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="card-surface divide-y divide-white/5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-full bg-arcane-800 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                {m.user.avatarUrl ? <img src={m.user.avatarUrl} className="w-full h-full object-cover" /> : (m.user.displayName ?? m.user.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user.displayName ?? m.user.username}</p>
                <p className="text-xs text-white/40">Rating {m.user.rating}</p>
              </div>
              {m.role !== "MEMBER" && <span className="text-xs text-amber-300 font-semibold">{m.role}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
