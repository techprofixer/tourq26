import { ImageResponse } from "next/og";
import { getTechNewsPostBySlug } from "@/lib/tech-news-content";

export const alt = "Tech news article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getTechNewsPostBySlug(slug);
  const title = article?.title ?? "Tech news";
  const description = article?.excerpt || article?.description || "";

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
          background: "linear-gradient(145deg, #07090e 0%, #161c26 45%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>torq</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>studio</span>
          <span style={{ fontSize: 18, color: "#64748b", marginLeft: 12 }}>Tech news</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 70 ? 40 : 52,
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.15,
              maxHeight: 280,
              overflow: "hidden",
            }}
          >
            {title.length > 160 ? `${title.slice(0, 157)}…` : title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 22,
                color: "#94a3b8",
                lineHeight: 1.4,
                maxHeight: 100,
                overflow: "hidden",
              }}
            >
              {description.length > 140 ? `${description.slice(0, 137)}…` : description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
