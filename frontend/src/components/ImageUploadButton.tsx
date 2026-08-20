import { useRef, useState } from "react";
import { api } from "../lib/api";
import { Icon } from "./Icon";

export function ImageUploadButton({ onUploaded, className }: { onUploaded: (url: string) => void; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.upload<{ url: string }>("/api/uploads/image", file);
      onUploaded(res.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir la imagen");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className={className ?? "btn-ghost px-3 py-2"}>
        {loading ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="image" size={16} />}
      </button>
    </>
  );
}
