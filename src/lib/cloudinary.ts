import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export class CloudinaryConfigError extends Error {
  constructor(message = "Cloudinary is not configured") {
    super(message);
    this.name = "CloudinaryConfigError";
  }
}

function getCloudinaryConfig() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

function ensureCloudinaryConfigured() {
  const config = getCloudinaryConfig();

  if (!config) {
    throw new CloudinaryConfigError(
      "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET",
    );
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return config;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

function mapUploadResponse(result: UploadApiResponse): UploadResult {
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function uploadImage(
  file: string | Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  },
): Promise<UploadResult> {
  ensureCloudinaryConfigured();

  const result = await cloudinary.uploader.upload(
    typeof file === "string" ? file : `data:image/jpeg;base64,${file.toString("base64")}`,
    {
      folder: options?.folder ?? "nyumbahub/properties",
      public_id: options?.publicId,
      tags: options?.tags ?? ["property", "image"],
      resource_type: "image",
      overwrite: false,
    },
  );

  return mapUploadResponse(result);
}

export async function uploadVideo(
  file: string | Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    tags?: string[];
  },
): Promise<UploadResult> {
  ensureCloudinaryConfigured();

  const result = await cloudinary.uploader.upload(
    typeof file === "string" ? file : `data:video/mp4;base64,${file.toString("base64")}`,
    {
      folder: options?.folder ?? "nyumbahub/properties/videos",
      public_id: options?.publicId,
      tags: options?.tags ?? ["property", "video"],
      resource_type: "video",
      overwrite: false,
    },
  );

  return mapUploadResponse(result);
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "video" = "image",
): Promise<{ result: string }> {
  ensureCloudinaryConfigured();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

  return { result: result.result ?? "unknown" };
}

export { cloudinary };
