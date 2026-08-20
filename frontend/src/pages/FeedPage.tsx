import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { PostCard } from "../components/PostCard";
import { ImageUploadButton } from "../components/ImageUploadButton";
import { StoriesBar } from "../components/StoriesBar";
import { Icon } from "../components/Icon";
import { LoadingState } from "../components/Loading";
import type { Post } from "../types";

export function FeedPage({ mode = "feed" }: { mode?: "feed" | "explore" }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    const data = await api.get<Post[]>(mode === "feed" ? "/api/posts/feed" : "/api/posts/explore");
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const post = await api.post<Post>("/api/posts", { content, images });
    setPosts((p) => [post, ...p]);
    setContent("");
    setImages([]);
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <h1 className="text-xl font-bold font-display mb-6">{mode === "feed" ? "Tu feed" : "Explorar"}</h1>

      {mode === "feed" && <StoriesBar />}

      {mode === "feed" && (
        <form onSubmit={handlePost} className="card-surface p-4 mb-6">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-arcane-800 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : (user?.displayName ?? user?.username ?? "?")[0].toUpperCase()}
            </div>
            <textarea
              className="input-field flex-1 resize-none text-sm"
              rows={2}
              placeholder="¿Qué mazo estás probando hoy?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 ml-12 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} className="rounded-lg h-24 w-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-3">
            <ImageUploadButton onUploaded={(url) => setImages((imgs) => (imgs.length < 6 ? [...imgs, url] : imgs))} />
            <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!content.trim()}>
              Publicar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <div className="card-surface p-8 text-center text-white/50 text-sm">
          {mode === "feed" ? "Seguí a otros jugadores para ver sus publicaciones acá." : "Todavía no hay publicaciones."}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
