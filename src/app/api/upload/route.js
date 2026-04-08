import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (before conversion)

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
]);

// Resolve effective MIME type — macOS/Safari often sends "" for HEIC files
function resolveType(file) {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  // Fall back to extension sniffing
  const ext = path.extname(file.name).toLowerCase();
  if (HEIC_EXTENSIONS.has(ext)) return "image/heic";
  return file.type || "";
}

export async function POST(request) {
  // Require authentication — uploads are studio-only
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

    // Validate resolved file type
    if (!ALLOWED_TYPES.has(effectiveType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}. Allowed: JPEG, PNG, GIF, WebP, SVG, HEIC.` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    let buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedBase = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    let outputExt = path.extname(file.name).toLowerCase() || ".jpg";

    // Convert HEIC/HEIF → JPEG — browsers cannot display HEIC natively
    if (effectiveType === "image/heic" || effectiveType === "image/heif") {
      buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      outputExt = ".jpg";
    }

    const uniqueName = `${Date.now()}-${sanitizedBase}${outputExt}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (e) {
    console.error("Upload failed:", e);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
