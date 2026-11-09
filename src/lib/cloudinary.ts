import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export type CloudinaryResourceType = "image" | "video" | "raw";

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export function uploadToCloudinary(
  buffer: Buffer,
  opts: { publicId: string; resourceType: CloudinaryResourceType },
): Promise<UploadApiResponse> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "torqstudio",
        public_id: opts.publicId,
        resource_type: opts.resourceType,
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Cloudinary upload returned no result"));
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: CloudinaryResourceType = "image",
): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/** Looks the asset up on Cloudinary directly, so stale DB rows (deleted from the Cloudinary
 *  dashboard, outside this app) can be flagged instead of silently 404ing. */
export async function checkCloudinaryResource(
  publicId: string,
  resourceType: CloudinaryResourceType = "image",
): Promise<{ exists: boolean; secureUrl?: string; bytes?: number; format?: string }> {
  ensureConfigured();
  try {
    const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return { exists: true, secureUrl: result.secure_url, bytes: result.bytes, format: result.format };
  } catch {
    return { exists: false };
  }
}
