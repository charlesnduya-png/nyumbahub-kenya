import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
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

async function persistStubUpload(
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
        if (!isCloudinaryConfigured()) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Video uploads require Cloudinary. Add Cloudinary credentials in production.",
            },
            { status: 503 },
          );
        }
      } else if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Only image files are allowed" },
          { status: 400 },
        );
      }

      const imageFolder =
        type === "profile"
          ? "your-home/profiles"
          : type === "blog"
            ? "your-home/blog"
            : "your-home/properties";

      if (!isCloudinaryConfigured()) {
        if (type === "video") {
          return NextResponse.json(
            {
              success: false,
              error:
                "Video uploads require Cloudinary. Add Cloudinary credentials in production.",
            },
            { status: 503 },
          );
        }
        // Keep stub payloads small so create-listing JSON fits Vercel body limits.
        if (file.size > 1.5 * 1024 * 1024) {
          return NextResponse.json(
            {
              success: false,
              stub: true,
              error:
                "Image hosting is not configured. Compress the photo under 1.5MB, or add Cloudinary credentials.",
            },
            { status: 503 },
          );
        }

        const dataUrl = await fileToDataUrl(file);
        const stored = await persistStubUpload(
          session.user.id,
          dataUrl,
          file.type || "image/jpeg",
        );
        return NextResponse.json({
          success: true,
          stub: true,
          data: stored,
        });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result =
        type === "video"
          ? await uploadVideo(buffer, { folder: "your-home/properties/videos" })
          : await uploadImage(buffer, { folder: imageFolder });

      return NextResponse.json({ success: true, data: result });
    }

    const body = await request.json();
    const { data, type = "image" } = body as { data?: string; type?: string };

    if (!data || typeof data !== "string") {
      return NextResponse.json(
        { success: false, error: "Base64 data is required" },
        { status: 400 },
      );
    }

    if (!isCloudinaryConfigured()) {
      const dataUrl = data.startsWith("data:")
        ? data
        : `data:image/jpeg;base64,${data}`;
      const stored = await persistStubUpload(session.user.id, dataUrl);
      return NextResponse.json({
        success: true,
        stub: true,
        data: stored,
      });
    }

    const result =
      type === "video"
        ? await uploadVideo(data, { folder: "your-home/properties/videos" })
        : await uploadImage(data, { folder: "your-home/properties" });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof CloudinaryConfigError) {
      return NextResponse.json(
        { success: false, error: error.message, stub: true },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
