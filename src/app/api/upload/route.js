import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { createClient } from "@/utils/supabase/server";
import { getServiceClient } from "@/lib/supabase";

// Prevent Next.js from statically optimising this route — it must always run
// on the server so cookies (auth) and the file payload are available.
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const BUCKET = "uploads";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif",
  "image/webp", "image/svg+xml", "image/heic", "image/heif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4", "video/webm", "video/ogg",
]);

function resolveType(file) {
  if (ALLOWED_IMAGE_TYPES.has(file.type) || ALLOWED_VIDEO_TYPES.has(file.type)) {
    return file.type;
  }
  const ext = path.extname(file.name || "").toLowerCase();
  if (ext === ".heic" || ext === ".heif") return "image/heic";
  return file.type || "";
}

// ── Local filesystem upload (dev only) ──────────────────────────
async function uploadToLocal(buffer, uniqueName) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  await fs.promises.writeFile(path.join(uploadsDir, uniqueName), buffer);
  return `/uploads/${uniqueName}`;
}

// ── Supabase Storage upload (production) ────────────────────────
// Removed the bucket-listing pre-check: it adds a round-trip on every upload
// and fails loudly if the service key lacks list-bucket permissions.
// We simply attempt the upload and let Supabase return a clear error if the
// bucket is missing or misconfigured.
async function uploadToSupabase(buffer, uniqueName, contentType) {
  const db = getServiceClient();

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(uniqueName, buffer, { contentType, upsert: false });

  if (uploadError) {
    throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(uniqueName);
  return publicUrl;
}

export async function POST(request) {
  // ── Everything inside a single try/catch so auth failures and unexpected
  //    errors always return a structured JSON response instead of a raw 500. ──
  try {
    // Auth — must have a valid session to upload
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form — Next.js App Router exposes Request.formData() natively
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
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024} MB.` },
        { status: 400 }
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedBase = (file.name || "file")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    let outputExt = path.extname(file.name || "").toLowerCase() || (isVideo ? ".mp4" : ".jpg");
    let contentType = effectiveType;

    // ── HEIC → JPEG conversion ───────────────────────────────────
    // sharp is a native binary. We lazy-import it so that a missing or
    // incompatible build (e.g. wrong Lambda architecture) does NOT crash the
    // entire route module — it only affects HEIC uploads, and we fall back to
    // uploading the original file in that case.
    if (effectiveType === "image/heic" || effectiveType === "image/heif") {
      try {
        const sharp = (await import("sharp")).default;
        buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        outputExt = ".jpg";
        contentType = "image/jpeg";
      } catch (heicErr) {
        // Log but don't fail — the original HEIC will be stored as-is
        console.warn("[upload] HEIC conversion unavailable, storing original:", heicErr.message);
      }
    }

    const uniqueName = `${Date.now()}-${sanitizedBase}${outputExt}`;

    // Prioritise Supabase if service role key is available (ensures production-ready URLs even in dev).
    // This fixes the issue where images uploaded in dev (local) don't work in production (Vercel).
    const canUseCloud = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
    const url = canUseCloud
      ? await uploadToSupabase(buffer, uniqueName, contentType)
      : await uploadToLocal(buffer, uniqueName);

    return NextResponse.json({ url });

  } catch (e) {
    // Log the full error object (not just .message) so Vercel function logs
    // expose the real stack trace when something unexpected goes wrong.
    console.error("[upload] Unhandled error:", e);
    const msg = e?.message || "Upload failed. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
