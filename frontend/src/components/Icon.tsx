const paths: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9",
  layers: "M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5M2 18l10 5 10-5",
  deck: "M5 4h11a2 2 0 0 1 2 2v13l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 0 1 2-2Z",
  user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M6 8a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 12.5 6 8ZM9.5 17a2.5 2.5 0 0 0 5 0",
  swords:
    "m14.5 3.5 6 6-2 2-6-6 2-2Zm-9 9 6 6-2 2-6-6 2-2ZM3 3l6 2 1 3-3-1-2-6Zm18 18-2-6-3-1 1 3 6 2Z",
  plus: "M12 5v14M5 12h14",
  heart: "M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.7 4A6 6 0 0 1 12 7a6 6 0 0 1 6.3-3c3.7.5 5.3 4 3.7 7.7C19.5 16.4 12 21 12 21Z",
  heartFilled: "M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.7 4A6 6 0 0 1 12 7a6 6 0 0 1 6.3-3c3.7.5 5.3 4 3.7 7.7C19.5 16.4 12 21 12 21Z",
  message: "M21 11.5a8.38 8.38 0 0 1-9 8.4A8.5 8.5 0 1 1 21 11.5Z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35",
  x: "M18 6 6 18M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  send: "m22 2-7 20-4-9-9-4 20-7Z",
  loader: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z",
};

interface IconProps {
  name: keyof typeof paths;
  size?: number;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, size = 20, className = "", filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
}
