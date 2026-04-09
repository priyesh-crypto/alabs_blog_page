import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { createClient } from "@/utils/supabase/server";
import { getServiceClient } from "@/lib/supabase";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const BUCKET = "uploads";

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif",
  "image/webp", "image/svg+xml", "image/heic", "image/heif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4", "video/webm", "video/ogg",
]);

function resolveType(file) {
  if (file.type && (ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_VIDEO_TYPES.has(file.type))) return file.type;
  const ext = path.extname(file.name).toLowerCase();
  if (HEIC_EXTENSIONS.has(ext)) return "image/heic";
  return file.type || "";
}

// ── Local filesystem upload (dev only) ──────────────────────────────
async function uploadToLocal(buffer, uniqueName) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadsDir, uniqueName), buffer);
  return `/uploads/${uniqueName}`;
}

// ── Supabase Storage upload (production) ────────────────────────────
async function uploadToSupabase(buffer, uniqueName, contentType) {
  const db = getServiceClient();

  // Ensure bucket exists
  const { data: buckets, error: listErr } = await db.storage.listBuckets();
  if (listErr) throw new Error(`Storage listBuckets failed: ${listErr.message}`);

  if (!buckets?.find((b) => b.name === BUCKET)) {
    const { error: createErr } = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_VIDEO_SIZE,
    });
    if (createErr && !createErr.message?.includes("already exists")) {
      throw new Error(`Could not create storage bucket: ${createErr.message}`);
    }
  }

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(uniqueName, buffer, { contentType, upsert: false });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(uniqueName);
  return publicUrl;
}

export async function POST(request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const effectiveType = resolveType(file);
    const isVideo = ALLOWED_VIDEO_TYPES.has(effectiveType);
    const isImage = ALLOWED_IMAGE_TYPES.has(effectiveType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Unsupported file type: "${file.type || "unknown"}". Allowed: JPEG, PNG, GIF, WebP, SVG, HEIC, MP4, WebM.` },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max is ${maxSize / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    let outputExt = path.extname(file.name).toLowerCase() || (isVideo ? ".mp4" : ".jpg");
    let contentType = effectiveType;

    // Convert HEIC/HEIF → JPEG in-memory
    if (effectiveType === "image/heic" || effectiveType === "image/heif") {
      buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      outputExt = ".jpg";
      contentType = "image/jpeg";
    }

    const uniqueName = `${Date.now()}-${sanitizedBase}${outputExt}`;
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production";

    const url = isProduction
      ? await uploadToSupabase(buffer, uniqueName, contentType)
      : await uploadToLocal(buffer, uniqueName);

    return NextResponse.json({ url });
  } catch (e) {
    const msg = e?.message || "Upload failed. Please try again.";
    console.error("[upload] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
