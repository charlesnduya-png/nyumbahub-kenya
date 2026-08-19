import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isBlobConfigured, uploadFileToBlob } from "@/lib/blob-storage";
import {
  isCloudinaryConfigured,
  CloudinaryConfigError,
  uploadImage,
  uploadVideo,
} from "@/lib/cloudinary";
import { mediaAssetServePath, saveMediaAsset } from "@/lib/media-assets";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${base64}`;
}

function stubFromDataUrl(dataUrl: string, mimeType?: string) {
  const publicId = `your-home/local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    url: dataUrl,
    publicId,
    mimeType: mimeType ?? null,
  };
}

async function persistNeonUpload(
  userId: string,
  dataUrl: string,
  mimeType?: string,
) {
  const stub = stubFromDataUrl(dataUrl, mimeType);
  try {
    await saveMediaAsset({
      userId,
      publicId: stub.publicId,
      url: dataUrl,
      mimeType: stub.mimeType,
    });
    return {
      url: mediaAssetServePath(stub.publicId),
      publicId: stub.publicId,
    };
  } catch (error) {
    console.error("MediaAsset save failed:", error);
    return {
      url: dataUrl,
      publicId: stub.publicId,
    };
  }
}

async function persistHostedUpload(
  userId: string,
  result: { url: string; publicId: string },
  mimeType?: string | null,
) {
  try {
    await saveMediaAsset({
      userId,
      publicId: result.publicId,
      url: result.url,
      mimeType: mimeType ?? null,
    });
  } catch (error) {
    console.error("MediaAsset save failed:", error);
  }
  return result;
}

function imageFolderFor(type: string) {
  if (type === "profile") return "your-home/profiles";
  if (type === "blog") return "your-home/blog";
  return "your-home/properties";
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const type = (formData.get("type") as string) ?? "image";

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 },
        );
      }

      const maxBytes = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > maxBytes) {
        return NextResponse.json(
          {
            success: false,
            error:
              type === "video"
                ? "Video must be 50MB or smaller"
                : "Image must be 8MB or smaller",
          },
          { status: 400 },
        );
      }

      if (type === "video") {
        if (!file.type.startsWith("video/")) {
          return NextResponse.json(
            { success: false, error: "Only video files are allowed" },
            { status: 400 },
          );
        }
      } else if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Only image files are allowed" },
          { status: 400 },
        );
      }

      const folder =
        type === "video" ? "your-home/properties/videos" : imageFolderFor(type);
      const buffer = Buffer.from(await file.arrayBuffer());

      if (isCloudinaryConfigured()) {
        const result =
          type === "video"
            ? await uploadVideo(buffer, { folder })
            : await uploadImage(buffer, { folder });
        const stored = await persistHostedUpload(
          session.user.id,
          result,
          file.type,
        );
        return NextResponse.json({ success: true, data: stored });
      }

      if (isBlobConfigured()) {
        const result = await uploadFileToBlob({
          data: buffer,
          filename: file.name || (type === "video" ? "video.mp4" : "photo.jpg"),
          contentType: file.type || "image/jpeg",
          folder,
        });
        const stored = await persistHostedUpload(
          session.user.id,
          result,
          file.type,
        );
        return NextResponse.json({ success: true, data: stored });
      }

      if (type === "video") {
        return NextResponse.json(
          {
            success: false,
            error: "Video uploads need image hosting to be configured.",
          },
          { status: 503 },
        );
      }

      if (file.size > 1.5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: "Compress the photo under 1.5MB and try again.",
          },
          { status: 503 },
        );
      }

      const dataUrl = await fileToDataUrl(file);
      const stored = await persistNeonUpload(
        session.user.id,
        dataUrl,
        file.type || "image/jpeg",
      );
      return NextResponse.json({
        success: true,
        data: stored,
      });
    }

    const body = await request.json();
    const { data, type = "image" } = body as { data?: string; type?: string };

    if (!data || typeof data !== "string") {
      return NextResponse.json(
        { success: false, error: "Base64 data is required" },
        { status: 400 },
      );
    }

    const dataUrl = data.startsWith("data:")
      ? data
      : `data:image/jpeg;base64,${data}`;
    const comma = dataUrl.indexOf(",");
    const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const buffer = Buffer.from(payload, "base64");
    const mimeMatch = dataUrl.match(/^data:([^;,]+)/i);
    const mimeType = mimeMatch?.[1] || "image/jpeg";
    const folder =
      type === "video" ? "your-home/properties/videos" : "your-home/properties";

    if (isCloudinaryConfigured()) {
      const result =
        type === "video"
          ? await uploadVideo(data, { folder })
          : await uploadImage(data, { folder });
      const stored = await persistHostedUpload(session.user.id, result, mimeType);
      return NextResponse.json({ success: true, data: stored });
    }

    if (isBlobConfigured()) {
      const result = await uploadFileToBlob({
        data: buffer,
        filename: type === "video" ? "video.mp4" : "photo.jpg",
        contentType: mimeType,
        folder,
      });
      const stored = await persistHostedUpload(session.user.id, result, mimeType);
      return NextResponse.json({ success: true, data: stored });
    }

    const stored = await persistNeonUpload(session.user.id, dataUrl, mimeType);
    return NextResponse.json({
      success: true,
      data: stored,
    });
  } catch (error) {
    if (error instanceof CloudinaryConfigError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 },
      );
    }

    console.error("Upload failed:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
