/**
 * Bulk-import 491 WordPress-migrated MDX posts into Supabase `posts` table.
 *
 * Usage:
 *   node scripts/import-mdx-to-supabase.mjs
 *   node scripts/import-mdx-to-supabase.mjs --dry-run   # preview without inserting
 *
 * Reads .env.local for Supabase credentials.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "blog");
const ENV_FILE = path.join(ROOT, ".env.local");
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 25; // Supabase upsert batch size

// ── Load .env.local manually (no dotenv dependency needed) ──────────
function loadEnv(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filepath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = { ...loadEnv(path.join(ROOT, ".env")), ...loadEnv(ENV_FILE) };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function calcReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

async function markdownToHtml(md) {
  const result = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(md);
  return result.toString();
}

// ── Read all MDX files ──────────────────────────────────────────────
function readAllMdx() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} MDX files in ${CONTENT_DIR}\n`);

  return files.map((f) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
    const { data, content } = matter(raw);
    return { filename: f, data, content };
  });
}

// ── Map MDX → Supabase row ──────────────────────────────────────────
async function mdxToRow({ data, content }) {
  const htmlContent = await markdownToHtml(content);
  const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "untitled";
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  return {
    title: data.title || "Untitled",
    slug,
    excerpt: data.description || "",
    content: htmlContent,
    category: categories[0] || "Data Science",
    domain_tags: categories,
    skill_level: "Beginner",
    read_time: calcReadTime(content),
    author_id: "al-editorial",
    image: data.featuredImage || "",
    alt_text: data.title ? data.title.slice(0, 150) : "",
    status: "Published",
    published_at: formatDate(data.date),
    updated_at: formatDate(data.modified || data.date),
    seo: {
      canonicalUrl: data.canonical || "",
      noIndex: true,
      metaTitle: data.title || "",
      metaDesc: data.description || "",
    },
    course_mappings: [],
    course_cta: "",
    newsletter: {},
    quiz: {},
    ai_hints: {
      entityTags: [...categories, ...tags].filter(Boolean),
      enabled: true,
    },
    trust: {},
    discussion: { qa: true, faqSchema: true, moderation: "auto" },
    advanced: {
      showLeadGen: false,
      showNextSteps: false,
      showCourseCta: false,
      showRightSidebar: true,
    },
  };
}

// ── Check for existing slugs ────────────────────────────────────────
async function getExistingSlugs() {
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .limit(10000);
  if (error) {
    console.error("Failed to fetch existing slugs:", error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => r.slug));
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY_RUN ? "=== DRY RUN MODE (no writes) ===\n" : "=== LIVE IMPORT ===\n");

  const mdxFiles = readAllMdx();
  const existingSlugs = await getExistingSlugs();
  console.log(`Existing posts in Supabase: ${existingSlugs.size}`);

  // Filter out posts that already exist (by slug)
  const newFiles = mdxFiles.filter((f) => {
    const slug = f.data.slug || f.filename.replace(".mdx", "");
    return !existingSlugs.has(slug);
  });

  console.log(`New posts to import: ${newFiles.length}`);
  if (newFiles.length === 0) {
    console.log("\nNothing to import — all posts already exist in Supabase.");
    return;
  }

  // Convert all MDX → rows
  console.log("\nConverting markdown to HTML...");
  const rows = [];
  for (let i = 0; i < newFiles.length; i++) {
    const row = await mdxToRow(newFiles[i]);
    rows.push(row);
    if ((i + 1) % 50 === 0) console.log(`  Converted ${i + 1}/${newFiles.length}`);
  }
  console.log(`  Converted ${rows.length}/${newFiles.length}\n`);

  if (DRY_RUN) {
    console.log("Sample row (first post):");
    const sample = { ...rows[0] };
    sample.content = sample.content.slice(0, 200) + "...";
    console.log(JSON.stringify(sample, null, 2));
    console.log(`\nDry run complete. ${rows.length} posts would be imported.`);
    return;
  }

  // Batch upsert
  let inserted = 0;
  let errors = 0;
  const errorDetails = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("posts")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: false })
      .select("slug");

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
      errors += batch.length;
      errorDetails.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message, slugs: batch.map((r) => r.slug) });
    } else {
      inserted += (data || []).length;
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${(data || []).length} posts upserted`);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`  Inserted/Updated: ${inserted}`);
  console.log(`  Errors: ${errors}`);

  if (errorDetails.length > 0) {
    const errFile = path.join(ROOT, "import-errors.json");
    fs.writeFileSync(errFile, JSON.stringify(errorDetails, null, 2));
    console.log(`  Error details: ${errFile}`);
  }

  // Verify
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });
  console.log(`  Total posts in Supabase now: ${count}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
