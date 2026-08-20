import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "./Icon";
import type { Comment, Post } from "../types";

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(post._count.comments);

  async function toggleLike() {
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      if (liked) await api.delete(`/api/posts/${post.id}/like`);
      else await api.post(`/api/posts/${post.id}/like`);
    } catch {
      setLiked(liked);
      setLikeCount((c) => c + (liked ? 1 : -1));
    }
  }

  async function loadComments() {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      const data = await api.get<Comment[]>(`/api/posts/${post.id}/comments`);
      setComments(data);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const comment = await api.post<Comment>(`/api/posts/${post.id}/comments`, { content: commentText });
    setComments((c) => [...c, comment]);
    setCommentCount((c) => c + 1);
    setCommentText("");
  }

  return (
    <div className="card-surface p-5">
      <Link to={`/perfil/${post.author.username}`} className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-arcane-800 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
          {post.author.avatarUrl ? <img src={post.author.avatarUrl} className="w-full h-full object-cover" /> : (post.author.displayName ?? post.author.username)[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{post.author.displayName ?? post.author.username}</p>
          <p className="text-xs text-white/40">
            @{post.author.username} · {new Date(post.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>
      </Link>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-3 rounded-lg max-h-96 w-full object-cover" />}

      <div className="mt-4 flex items-center gap-5 text-white/50">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm ${liked ? "text-rose-400" : ""}`}>
          <Icon name={liked ? "heartFilled" : "heart"} size={17} filled={liked} />
          {likeCount}
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 text-sm">
          <Icon name="message" size={17} />
          {commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-medium">{c.author.displayName ?? c.author.username}</span>{" "}
              <span className="text-white/70">{c.content}</span>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              className="input-field flex-1 text-sm py-2"
              placeholder="Escribí un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn-ghost px-3">
              <Icon name="send" size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
