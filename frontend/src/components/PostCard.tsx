import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Icon } from "./Icon";
import { ReactionPicker } from "./ReactionPicker";
import type { Comment, Post, ReactionType } from "../types";

interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>(comments.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export function PostCard({ post }: { post: Post }) {
  const [reaction, setReaction] = useState<ReactionType | null>(post.myReaction ?? null);
  const [reactionTotal, setReactionTotal] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentCount, setCommentCount] = useState(post._count.comments);

  async function react(type: ReactionType | null) {
    const had = !!reaction;
    setReactionTotal((c) => c + (type ? (had ? 0 : 1) : -1));
    setReaction(type);
    try {
      if (type) await api.post(`/api/posts/${post.id}/like`, { type });
      else await api.delete(`/api/posts/${post.id}/like`);
    } catch {
      // best-effort, ignore
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

  async function submitReply(parentId: string) {
    if (!replyText.trim()) return;
    const comment = await api.post<Comment>(`/api/posts/${post.id}/comments`, { content: replyText, parentId });
    setComments((c) => [...c, comment]);
    setCommentCount((c) => c + 1);
    setReplyText("");
    setReplyingTo(null);
  }

  const images = post.images && post.images.length > 0 ? post.images : post.imageUrl ? [post.imageUrl] : [];
  const tree = buildTree(comments);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
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
        {post.group && (
          <Link to={`/grupos/${post.group.slug}`} className="text-xs text-arcane-300 bg-arcane-500/10 px-2.5 py-1 rounded-full font-medium">
            {post.group.name}
          </Link>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {images.length === 1 && <img src={images[0]} alt="" className="mt-3 rounded-lg max-h-96 w-full object-cover" />}
      {images.length > 1 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg h-52 w-40 object-cover shrink-0" />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 text-white/50">
        <ReactionPicker current={reaction} total={reactionTotal} onReact={react} />
        <button onClick={loadComments} className="flex items-center gap-1.5 text-sm">
          <Icon name="message" size={17} />
          {commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-3">
          {tree.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <div className="text-sm">
                <span className="font-medium">{c.author.displayName ?? c.author.username}</span>{" "}
                <span className="text-white/70">{c.content}</span>
                <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="ml-2 text-xs text-white/40 hover:text-white/70 inline-flex items-center gap-1">
                  <Icon name="reply" size={12} />
                  Responder
                </button>
              </div>

              {c.children.length > 0 && (
                <div className="ml-5 pl-3 border-l border-white/10 flex flex-col gap-2">
                  {c.children.map((child) => (
                    <div key={child.id} className="text-sm">
                      <span className="font-medium">{child.author.displayName ?? child.author.username}</span>{" "}
                      <span className="text-white/70">{child.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitReply(c.id);
                  }}
                  className="ml-5 flex gap-2"
                >
                  <input
                    autoFocus
                    className="input-field flex-1 text-xs py-1.5"
                    placeholder={`Responder a ${c.author.displayName ?? c.author.username}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <button type="submit" className="btn-ghost px-2.5">
                    <Icon name="send" size={14} />
                  </button>
                </form>
              )}
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
