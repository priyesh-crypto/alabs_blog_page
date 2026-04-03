/**
 * Seed script — migrates posts.json + authors into Supabase.
 * Run: node supabase/seed.js
 * (reads SUPABASE_SERVICE_ROLE_KEY from .env.local automatically)
 */

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');

// Load .env.local manually (no dotenv dependency needed)
const envPath = join(__dirname, '../.env.local');
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#') && rest.length) {
      process.env[k.trim()] = rest.join('=').trim();
    }
  });
} catch { /* .env.local missing is fine in CI */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || SERVICE_KEY === 'your_service_role_key_here') {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Authors ───────────────────────────────────────────────────────
const authors = [
  { slug: "s-dutta", name: "S. Dutta", initials: "SD", color: "bg-primary-container",
    bio: "Senior Data Scientist with 10+ years experience in probabilistic modeling and quantitative finance.",
    linkedin: "https://linkedin.com/in/sdutta-mock",
    expertise: ["Statistics", "Machine Learning", "Bayesian Inference"], experience: "10 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMr60OXqV8zI3Zk0C0ETUOloQaTtAXKObnroPkmQdBL29_hVyUdJ-LSpSMGeYarlq66xkm4Z2MA3h-7o-vlqf7wM3m_3eAspRDpqzPgAu4eiiGgNXkj1UZEh-BCEdP7eAlO4lvBrV0t6bHKOrEUtbma5CaVChapJWGIPz8r3mepo-RZwhhqAlgITBPNu8St4Ko8WmG_u9QTbPqR6H-PnvImPZqflWN_PTxmYHqbVwdsdXfaU9FHf7ByKii_EAbmhKkyuZCkxf18lmS" },
  { slug: "a-kapoor", name: "A. Kapoor", initials: "AK", color: "bg-tertiary-container",
    bio: "Lead AI Engineer building high-throughput ML pipelines and scalable vector similarity infrastructure.",
    linkedin: "https://linkedin.com/in/akapoor-mock",
    expertise: ["Data Engineering", "Vector Databases", "MLOps"], experience: "7 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqbmACZVEBM4Y4qOv1IIUcz17R6_yLTz9ipnfQoZQktUZXYK0sGC5gP7okIqdq-37FayoBWmrTZvwSSPJYUfXEjMvQH3TsLFnvXYb_nPl-cTo1XDIDndpx2C6jKPZYXtq369tEZOfJrQldj-qAdIZR07jRGFVvdmTLHM3CfaKXsrOWkGwx_gFbMJmlCONTSnLccG_AIjG9XlI3T16B_wgKWIZbI7JGq0KbFEEgjkVfqM7vhtpSmf2yJxQFdPGZzec0CBE2asckyogV" },
  { slug: "r-long", name: "R. Long", initials: "RL", color: "bg-secondary-fixed",
    bio: "AI Researcher focusing on prompt engineering, safety alignments, and deterministic generation.",
    linkedin: "https://linkedin.com/in/rlong-mock",
    expertise: ["Generative AI", "Prompt Engineering"], experience: "5 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0-4I2p4D7_DV8w8c-ChPKLcxGj3rQV_UciKqavuQFAkQeVjO29CuIhMKEHouka2KQQMGcyTgp7OOBFTn7k3VmsfhWbDE_q2DZn5P2nY27vFb2qyS4gbv_CEQsheGIdQzl8NQPXNMzqos59jNdacWdbC4zs1_Ow3ccdw-B3Ij5t-JriFYtteDLXb3Mg-MG2N2CKBm1UBX_tBtV5qwaGRK9Syl4Yg4exf_MvcWhLMzxd4K6T8YN0Ao2JgqgeLCpWG7jvOX3Lojt3wUp" },
  { slug: "al-editorial", name: "AL Labs Editorial", initials: "AL", color: "bg-primary",
    bio: "The AnalytixLabs internal writing team, curating the best in data science education.",
    linkedin: "https://linkedin.com/company/analytixlabs",
    expertise: ["Data Science Education", "Career Advice"], experience: "12 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWH0-iy0YexEmNgbb6xT4xV9b6GsoFnY_9aUMH6fTFAQclaeR3Q3aaUejHYtdNeoOUCTHo8msFSglbimLSEzN8cRXBVovh6XHhCo8N7AGOkSGG7g42Soi0OGcBxTncG9BuB7d3Q885lglT_5HxweffsUakx3AzCrpMIEhhDwPn5bNo8LmtHlY3K0HomYlDlJZ_6y4dfViCcAmAEtc4Uji5B7X82cLIVqrEJZuSbAuamU0ZRAZZl5bXiz7fveiMJcorj_U3ODpBe3kQ" },
  { slug: "aris-thorne", name: "Dr. Aris Thorne", initials: "AT", color: "bg-primary-container",
    bio: "Chief ML Architect. Aris leads the AI research division at AnalytixLabs with over 15 years in predictive modeling and neural architecture search.",
    linkedin: "https://linkedin.com/in/aris-thorne",
    expertise: ["Neural Architecture", "Transformers", "Deep Learning"], experience: "15 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRG-_Ndw0YrduOsgmsEJX_Jm6TR75Ghzm5RN42hzi5WzxAtIWIMEmQWKMhxdA2yLswwhqDOOt5qWJvLsRRcZ1KFCxAWb7559VQIkaC5hFUjsKiQ_lq33vk-a-nRYYkIoXe30BuU8B6HIhXbsgE7eUNcrpzEvnl4QHQNSUYsY-tn5MvhnDXDVwQKmYyw_YWkOVOO5RSEpGsI0zdiNdkAOlNxZERYHt34IrTHdrZc7QKenh9t4Yxcx3Kvkxbht8V-qBJqfwXHIYWftur" },
];

// ── Load posts.json ────────────────────────────────────────────────
const postsRaw = JSON.parse(
  readFileSync(join(__dirname, '../src/lib/posts.json'), 'utf8')
);

function mapPost(p) {
  return {
    id:              p.id,
    title:           p.title,
    slug:            p.slug,
    excerpt:         p.excerpt || '',
    content:         p.content || '',
    category:        p.category || '',
    domain_tags:     p.domain_tags || [],
    skill_level:     p.skill_level || 'Beginner',
    read_time:       p.readTime || '',
    author_id:       p.authorId || 'al-editorial',
    image:           p.image || '',
    status:          p.status || 'Published',
    published_at:    p.publishedAt || '',
    updated_at:      p.updatedAt || '',
    seo:             p.seo || {},
    course_mappings: p.courseMappings || [],
    course_cta:      p.courseCTA || '',
    newsletter:      p.newsletter || {},
    quiz:            p.quiz || {},
    ai_hints:        p.aiHints || {},
    trust:           p.trust || {},
    discussion:      p.discussion || {},
    advanced:        p.advanced || {},
  };
}

async function seed() {
  console.log('🌱  Seeding authors…');
  const { error: authErr } = await supabase
    .from('authors')
    .upsert(authors, { onConflict: 'slug' });
  if (authErr) { console.error('Authors error:', authErr.message); process.exit(1); }
  console.log(`   ✓ ${authors.length} authors upserted`);

  console.log('🌱  Seeding posts…');
  const rows = postsRaw.map(mapPost);
  const { error: postsErr } = await supabase
    .from('posts')
    .upsert(rows, { onConflict: 'id' });
  if (postsErr) { console.error('Posts error:', postsErr.message); process.exit(1); }
  console.log(`   ✓ ${rows.length} posts upserted`);

  console.log('✅  Done! Supabase is now the live data source.');
}

seed();
