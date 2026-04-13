/**
 * This script identifies broken local image links in your Supabase database.
 * No external dependencies required (except @supabase/supabase-js which is in package.json).
 * To use: Run `node scratch/repair-db-images.js` from your terminal.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency on dotenv
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase environment variables in .env.local");
  console.log("Expected: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("🔍 Scanning Supabase tables for broken local paths (/uploads/...)\n");

  // Check Authors
  const { data: authors, error: authorErr } = await supabase.from('authors').select('slug, name, image');
  if (authorErr) {
    console.error("Author fetch error:", authorErr.message);
  } else {
    const brokenAuthors = (authors || []).filter(a => a.image?.includes('/uploads/'));
    if (brokenAuthors.length === 0) {
      console.log("✅ Authors: All images are cloud-linked or empty.");
    } else {
      brokenAuthors.forEach(a => {
        console.log(`[Author] ❌ ${a.name} (${a.slug}): Local image found -> ${a.image}`);
      });
    }
  }

  // Check Posts
  const { data: posts, error: postErr } = await supabase.from('posts').select('slug, title, image');
  if (postErr) {
    console.error("Post fetch error:", postErr.message);
  } else {
    const brokenPosts = (posts || []).filter(p => p.image?.includes('/uploads/'));
    if (brokenPosts.length === 0) {
      console.log("✅ Posts: All images are cloud-linked or empty.");
    } else {
      brokenPosts.forEach(p => {
        console.log(`[Post] ❌ ${p.title} (${p.slug}): Local image found -> ${p.image}`);
      });
    }
  }

  console.log("\n💡 Recommendation: Any images marked with ❌ must be re-uploaded via the Studio.");
  console.log("Future uploads will now automatically go to Supabase Storage due to the route update.");
}

checkDatabase().catch(err => {
  console.error("Fatal error:", err);
});
