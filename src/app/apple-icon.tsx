import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône pour l'écran d'accueil des téléphones. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf8f1" }}>
        <svg width="140" height="140" viewBox="0 0 32 32">
          <path d="M16 29C16 18 10 10 3 7c1 9 5 17 13 22Z" fill="#7a9a4e" />
          <path d="M16 29C16 18 22 10 29 7c-1 9-5 17-13 22Z" fill="#c9a24b" />
        </svg>
      </div>
    ),
    size,
  );
}
