import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  isCloudinaryConfigured,
  CloudinaryConfigError,
  uploadImage,
  uploadVideo,
} from "@/lib/cloudinary";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${base64}`;
}

function stubFromDataUrl(dataUrl: string) {
  return {
    url: dataUrl,
    publicId: `nyumbahub/local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
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

      if (type !== "video" && !file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Only image files are allowed" },
          { status: 400 },
        );
      }

      if (!isCloudinaryConfigured()) {
        const dataUrl = await fileToDataUrl(file);
        return NextResponse.json({
          success: true,
          stub: true,
          data: stubFromDataUrl(dataUrl),
        });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result =
        type === "video"
          ? await uploadVideo(buffer, { folder: "nyumbahub/properties/videos" })
          : await uploadImage(buffer, { folder: "nyumbahub/properties" });

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
      return NextResponse.json({
        success: true,
        stub: true,
        data: stubFromDataUrl(data.startsWith("data:") ? data : `data:image/jpeg;base64,${data}`),
      });
    }

    const result =
      type === "video"
        ? await uploadVideo(data, { folder: "nyumbahub/properties/videos" })
        : await uploadImage(data, { folder: "nyumbahub/properties" });

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
