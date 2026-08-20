export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/40 py-8 justify-center">
      <svg className="loading-ring" width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--accent-soft)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label}
    </div>
  );
}
