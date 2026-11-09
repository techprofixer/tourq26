import { prisma } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  checkCloudinaryResource,
  type CloudinaryResourceType,
} from "@/lib/cloudinary";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type MediaAssetDto = {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  alt: string | null;
  title: string | null;
  cdnKey: string | null;
  kind: MediaKind;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
};

type MediaKind = "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO" | "OTHER";

function inferKind(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf" || mimeType.startsWith("application/msword") || mimeType.includes("document")) {
    return "DOCUMENT";
  }
  return "OTHER";
}

function cloudinaryResourceType(kind: MediaKind): CloudinaryResourceType {
  if (kind === "IMAGE") return "image";
  if (kind === "VIDEO") return "video";
  return "raw";
}

function sanitizeFilename(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").replace(/-+/g, "-");
  return base || "file";
}

function toDto(row: {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  alt: string | null;
  title: string | null;
  cdnKey: string | null;
  kind: string;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
}): MediaAssetDto {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    alt: row.alt,
    title: row.title,
    cdnKey: row.cdnKey,
    kind: row.kind as MediaKind,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listMediaAssets(): Promise<MediaAssetDto[]> {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map(toDto);
}

export async function saveMediaFile(file: File): Promise<MediaAssetDto> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = sanitizeFilename(file.name);
  const mimeType = file.type || "application/octet-stream";
  const kind = inferKind(mimeType);
  const storedName = `${Date.now()}-${filename}`;

  let url: string;
  let cdnKey: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(buffer, {
      publicId: storedName.replace(/\.[^.]+$/, ""),
      resourceType: cloudinaryResourceType(kind),
    });
    url = result.secure_url;
    cdnKey = result.public_id;
    width = result.width ?? null;
    height = result.height ?? null;
  } else {
    // Local disk only survives on a persistent filesystem — fine for local dev, but on
    // serverless hosts (Vercel) this directory doesn't persist across deploys/instances.
    // Set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in production to use Cloudinary instead.
    await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
    url = `/uploads/${storedName}`;
  }

  const row = await prisma.mediaAsset.create({
    data: { kind, url, cdnKey, filename, mimeType, width, height, sizeBytes: buffer.byteLength },
  });
  return toDto(row);
}

export type MediaAssetStatus = MediaAssetDto & {
  cloudinary: { checked: boolean; exists: boolean };
};

/** Fetches one asset and, if it's stored on Cloudinary, verifies it still exists there —
 *  surfaces rows left dangling by deletes made directly in the Cloudinary dashboard. */
export async function getMediaAssetStatus(id: string): Promise<MediaAssetStatus | null> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return null;
  const dto = toDto(row);
  if (!row.cdnKey || !isCloudinaryConfigured()) {
    return { ...dto, cloudinary: { checked: false, exists: false } };
  }
  const status = await checkCloudinaryResource(row.cdnKey, cloudinaryResourceType(row.kind as MediaKind));
  return { ...dto, cloudinary: { checked: true, exists: status.exists } };
}

export async function updateMediaAsset(
  id: string,
  data: { alt?: string | null; title?: string | null },
): Promise<MediaAssetDto | null> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return null;
  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(data.alt !== undefined ? { alt: data.alt?.trim() || null } : {}),
      ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
    },
  });
  return toDto(updated);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return;
  await prisma.mediaAsset.delete({ where: { id } });
  if (row.cdnKey) {
    await deleteFromCloudinary(row.cdnKey, cloudinaryResourceType(row.kind as MediaKind)).catch(() => {});
    return;
  }
  const filePath = path.join(process.cwd(), "public", row.url.replace(/^\//, ""));
  await unlink(filePath).catch(() => {});
}
