import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/with-admin", () => ({ withAdmin: <F>(handler: F) => handler }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn(async () => {}) }));

import { slugify } from "@/lib/slug";
import { buildCsp } from "@/lib/csp";
import { createSlugCollectionRoutes } from "@/lib/slug-collection-routes";
import { normaliseCaseStudyInput } from "@/lib/content-collections";

describe("slugify", () => {
  it.each([
    ["Hello World", "hello-world"],
    ["Café Déjà Vu", "cafe-deja-vu"],
    ["Don't stop", "dont-stop"],
    ["  --Weird__ spacing!! ", "weird-spacing"],
  ])("%s → %s", (input, out) => expect(slugify(input)).toBe(out));

  it("is idempotent on clean slugs (stored slugs never change on re-slugify)", () => {
    for (const s of ["hello-world", "a1-b2", "mobile-app-development"]) expect(slugify(s)).toBe(s);
  });
  it("caps at 80 chars without a trailing hyphen", () => {
    const s = slugify(`${"a".repeat(79)} b`);
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
  it("uses the fallback when nothing is left", () => {
    expect(slugify("!!!", "plan-1")).toBe("plan-1");
  });
});

describe("buildCsp", () => {
  it("public policy: no nonce, allow-listed origins, no eval in prod", () => {
    const csp = buildCsp({ isDev: false });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://connect.facebook.net");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
  });
  it("admin policy: nonce + strict-dynamic and no unsafe-inline scripts", () => {
    const csp = buildCsp({ nonce: "abc123", isDev: false });
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
  });
  it("dev allows eval + HMR websocket and skips the https upgrade", () => {
    const csp = buildCsp({ isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws:");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

describe("normaliseCaseStudyInput", () => {
  it("ignores mistyped fields and keeps previous values", () => {
    const prev = normaliseCaseStudyInput({ title: "Old", client: "Acme", services: ["web"] });
    const next = normaliseCaseStudyInput(
      { title: 42, client: { $ne: 1 }, services: ["mobile", 3, " "], slug: "New Slug!" },
      { ...prev, slug: "old" },
    );
    expect(next.title).toBe("Old");
    expect(next.client).toBe("Acme");
    expect(next.services).toEqual(["mobile"]);
    expect(next.slug).toBe("new-slug");
  });
});

describe("createSlugCollectionRoutes", () => {
  type Item = { slug: string; title: string; status?: string };
  let store: Item[];
  const routes = createSlugCollectionRoutes<Item>({
    read: async () => structuredClone(store),
    write: async (items) => {
      store = items;
    },
    normalise: (raw, prev) => ({
      slug: typeof raw.slug === "string" ? slugify(raw.slug) : prev?.slug,
      title: typeof raw.title === "string" ? raw.title : (prev?.title ?? ""),
      status: typeof raw.status === "string" ? raw.status : prev?.status,
    }),
    entityType: "test",
    label: "test item",
    publicBase: "/test",
    fallbackSlugPrefix: "item",
  });
  const req = (body: unknown) =>
    new NextRequest("http://localhost/api", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

  beforeEach(() => {
    store = [{ slug: "existing", title: "Existing" }];
  });

  it("creates with a slug derived from the title", async () => {
    const res = await routes.collection.POST(req({ title: "Hello There" }));
    expect(res.status).toBe(200);
    expect(store.map((i) => i.slug)).toEqual(["existing", "hello-there"]);
  });
  it("rejects missing title, invalid JSON and duplicate slugs", async () => {
    expect((await routes.collection.POST(req({}))).status).toBe(400);
    expect((await routes.collection.POST(req("not json"))).status).toBe(400);
    expect((await routes.collection.POST(req({ title: "Existing" }))).status).toBe(400);
    expect(store).toHaveLength(1);
  });
  it("updates, renames, and refuses renaming onto another item", async () => {
    store.push({ slug: "other", title: "Other" });
    expect((await routes.item.PUT(req({ slug: "other" }), ctx("existing"))).status).toBe(400);
    const ok = await routes.item.PUT(req({ title: "Renamed", slug: "renamed" }), ctx("existing"));
    expect(ok.status).toBe(200);
    expect(store.find((i) => i.slug === "renamed")?.title).toBe("Renamed");
  });
  it("404s on unknown slugs and deletes known ones", async () => {
    expect((await routes.item.GET(req({}), ctx("nope"))).status).toBe(404);
    expect((await routes.item.DELETE(req({}), ctx("nope"))).status).toBe(404);
    expect((await routes.item.DELETE(req({}), ctx("existing"))).status).toBe(200);
    expect(store).toHaveLength(0);
  });
});
