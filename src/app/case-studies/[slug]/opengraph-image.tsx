import { ImageResponse } from "next/og";
import { getCaseStudyBySlug } from "@/lib/case-studies-content";

export const alt = "Case study";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = await getCaseStudyBySlug(slug);
  const title = study?.title ?? "Case study";
  const line = study?.industry ?? "Torq Studio";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(155deg, #07090e 0%, #1c1410 38%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>torq</span>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b" }}>studio</span>
          <span style={{ fontSize: 16, color: "#64748b", marginLeft: 12 }}>Case study</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 15, color: "#fbbf24", fontWeight: 600 }}>{line}</div>
          <div
            style={{
              fontSize: title.length > 90 ? 36 : 46,
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.12,
              maxHeight: 260,
              overflow: "hidden",
            }}
          >
            {title.length > 180 ? `${title.slice(0, 177)}…` : title}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
