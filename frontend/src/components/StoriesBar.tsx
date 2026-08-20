import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { ImageUploadButton } from "./ImageUploadButton";
import { Icon } from "./Icon";
import type { StoryGroup } from "../types";

export function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewing, setViewing] = useState<{ group: StoryGroup; index: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    api.get<StoryGroup[]>("/api/stories").then(setGroups);
  }
  useEffect(load, []);

  async function handleUpload(url: string) {
    setUploading(true);
    try {
      await api.post("/api/stories", { imageUrl: url });
      load();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 mb-6">
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative w-16 h-16 rounded-full bg-arcane-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20">
          {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Icon name="user" size={22} className="text-white/40" />}
          <ImageUploadButton onUploaded={handleUpload} className="absolute inset-0 flex items-center justify-center bg-black/50" />
        </div>
        <span className="text-[11px] text-white/50">{uploading ? "Subiendo..." : "Tu historia"}</span>
      </div>

      {groups.map((g) => (
        <button key={g.authorId} onClick={() => setViewing({ group: g, index: 0 })} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-amber-300 via-arcane-400 to-arcane-700">
            <div className="w-full h-full rounded-full overflow-hidden bg-arcane-800 flex items-center justify-center border-2 border-[var(--bg)]">
              {g.author.avatarUrl ? <img src={g.author.avatarUrl} className="w-full h-full object-cover" /> : (g.author.displayName ?? g.author.username)[0].toUpperCase()}
            </div>
          </div>
          <span className="text-[11px] text-white/60 max-w-[64px] truncate">{g.author.displayName ?? g.author.username}</span>
        </button>
      ))}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setViewing(null)}>
          <div className="relative w-full max-w-sm h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img src={viewing.group.stories[viewing.index].imageUrl} className="w-full h-full object-cover rounded-xl" />
            {viewing.group.stories[viewing.index].caption && (
              <p className="absolute bottom-4 left-4 right-4 text-white text-sm bg-black/50 rounded-lg p-2">{viewing.group.stories[viewing.index].caption}</p>
            )}
            <button onClick={() => setViewing(null)} className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5">
              <Icon name="x" size={18} />
            </button>
            {viewing.index > 0 && (
              <button
                onClick={() => setViewing({ ...viewing, index: viewing.index - 1 })}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
              >
                ‹
              </button>
            )}
            {viewing.index < viewing.group.stories.length - 1 && (
              <button
                onClick={() => setViewing({ ...viewing, index: viewing.index + 1 })}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
