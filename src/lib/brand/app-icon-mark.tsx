type AppIconMarkProps = {
  size: number;
  variant?: "default" | "maskable";
};

/** Shared mark for favicon, apple-touch-icon, and PWA manifest icons. */
export function AppIconMark({ size, variant = "default" }: AppIconMarkProps) {
  const maskable = variant === "maskable";
  const ring = Math.round(size * (maskable ? 0.58 : 0.72));
  const star = Math.round(size * (maskable ? 0.24 : 0.3));
  const stroke = Math.max(2, Math.round(size * 0.012));
  const dot = Math.max(3, Math.round(size * 0.028));
  const center = size / 2;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(150deg, #a83232 0%, #8b1a1a 48%, #5c1010 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: ring,
          height: ring,
          borderRadius: ring,
          border: `${stroke}px solid rgba(200, 146, 42, 0.55)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: ring * 0.62,
          height: ring * 0.62,
          borderRadius: ring,
          border: `${Math.max(1, stroke - 1)}px solid rgba(251, 246, 238, 0.18)`,
        }}
      />
      <svg
        width={star}
        height={star}
        viewBox="0 0 100 100"
        style={{ display: "block" }}
      >
        <path
          fill="#e0a83c"
          d="M50 8 L61 38 H93 L67 57 L78 88 L50 69 L22 88 L33 57 L7 38 H39 Z"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: center - dot / 2,
          left: center + ring / 2 - dot / 2,
          width: dot,
          height: dot,
          borderRadius: dot,
          background: "#fbf6ee",
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export const APP_ICON_SIZES = {
  "32": 32,
  "192": 192,
  "512": 512,
  "512-maskable": 512,
} as const;

export type AppIconId = keyof typeof APP_ICON_SIZES;
