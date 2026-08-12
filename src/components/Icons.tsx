// ─────────────────────────────────────────────────────────────
//  CHALK ICONS — hand-drawn strokes for the yard's UI (Season 3)
//
//  Every icon in the game's chrome is a single rough stroke path,
//  like someone drew it on the blacktop with a fat piece of chalk.
//  No emoji in the UI chrome — the chalk voice is its own
//  signature. (Badges and ranks keep their sticker emoji on
//  purpose: those are content, not chrome.)
// ─────────────────────────────────────────────────────────────

import type { ReactElement } from "react";

export type IconName =
  | "play" | "pause" | "gear" | "trophy" | "camera" | "photo"
  | "speaker" | "speakerOff" | "x" | "bell" | "save" | "back" | "check" | "home";

const P: Record<IconName, ReactElement> = {
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8M5.4 5.4l2 2M16.6 16.6l2 2M18.6 5.4l-2 2M7.4 16.6l-2 2" />
    </>
  ),
  trophy: <path d="M7 4h10v6a5 5 0 0 1-10 0zM7 6H4v1a4 4 0 0 0 4.2 4M17 6h3v1a4 4 0 0 1-4.2 4M12 15v4M8.5 21h7" />,
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  photo: <path d="M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 3-3L20 17" />,
  speaker: <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" />,
  speakerOff: <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5zM15.5 9.5l4.5 5M20 9.5l-4.5 5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  bell: <path d="M6 16v-1l1.5-1.5V9.5a4.5 4.5 0 0 1 9 0v4L18 15v1zM10.6 19a1.4 1.4 0 0 0 2.8 0" />,
  save: <path d="M12 3.5V13M7.5 9.5 12 14l4.5-4.5M5 19h14" />,
  back: <path d="M4.5 12h15M10 6.5l-5.5 5.5L10 17.5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  home: <path d="M4 11l8-6.5L20 11M6.5 10v9h11v-9" />,
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
