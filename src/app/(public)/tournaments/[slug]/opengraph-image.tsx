import { ImageResponse } from "next/og";
import { api } from "@/shared/api/endpoints";
import { FORMAT_LABELS, GAME_NAMES } from "@/shared/lib/labels";
import { fmtDate } from "@/shared/lib/format";

export const alt = "Турнир на CTS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OG-картинка турнира. Когда у турнира появится арт — подложить его фоном вместо штриховки. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await api.tournament(slug).catch(() => null);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b0d11", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "#d5dbe3", color: "#0b0d11", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>C</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>CTS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#8ba3be", textTransform: "uppercase" }}>{t ? `${GAME_NAMES[t.game]} · ${FORMAT_LABELS[t.format]}` : "Турнир"}</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase" }}>{t?.name ?? "CTS"}</div>
        </div>
        <div style={{ display: "flex", gap: 48, fontSize: 26, color: "#b3b9c2" }}>
          {t && <span>{t.teams.max} команд</span>}
          {t && <span>{t.city}</span>}
          {t && <span>Финал {fmtDate(t.finalAt)}</span>}
        </div>
      </div>
    ),
    size,
  );
}
