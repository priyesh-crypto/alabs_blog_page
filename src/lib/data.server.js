/**
 * Server-only data helpers — use these in Server Components and Server Actions.
 * Do NOT import this file in 'use client' components.
 */

import { supabase } from './supabase';
import { courses, salaryData, authors as staticAuthors } from './data';

// ── Author cache (hydrated on first call) ─────────────────────────
let _authorsCache = null;

async function getAuthorsMap() {
  if (_authorsCache) return _authorsCache;
  const { data, error } = await supabase.from('authors').select('*');
  if (error || !data?.length) {
    // Fall back to static if DB isn't reachable yet
    _authorsCache = staticAuthors;
  } else {
    _authorsCache = Object.fromEntries(data.map(a => [a.slug, a]));
  }
  return _authorsCache;
}

// ── Column mapping: DB snake_case → app camelCase ─────────────────
async function mapPost(row) {
  if (!row) return null;
  const authorsMap = await getAuthorsMap();
  return {
    id:             row.id,
    title:          row.title,
    slug:           row.slug,
    excerpt:        row.excerpt,
    content:        row.content,
    category:       row.category,
    domain_tags:    row.domain_tags ?? [],
    skill_level:    row.skill_level,
    readTime:       row.read_time,
    authorId:       row.author_id,
    image:          row.image,
    status:         row.status,
    publishedAt:    row.published_at,
    updatedAt:      row.updated_at,
    seo:            row.seo ?? {},
    courseMappings: row.course_mappings ?? [],
    courseCTA:      row.course_cta ?? '',
    newsletter:     row.newsletter ?? {},
    quiz:           row.quiz ?? {},
    aiHints:        row.ai_hints ?? {},
    trust:          row.trust ?? {},
    discussion:     row.discussion ?? {},
    advanced:       row.advanced ?? {},
    author:         authorsMap[row.author_id] ?? null,
  };
}

async function mapPosts(rows) {
  const authorsMap = await getAuthorsMap();
  return rows.map(row => ({
    id:             row.id,
    title:          row.title,
    slug:           row.slug,
    excerpt:        row.excerpt,
    content:        row.content,
    category:       row.category,
    domain_tags:    row.domain_tags ?? [],
    skill_level:    row.skill_level,
    readTime:       row.read_time,
    authorId:       row.author_id,
    image:          row.image,
    status:         row.status,
    publishedAt:    row.published_at,
    updatedAt:      row.updated_at,
    seo:            row.seo ?? {},
    courseMappings: row.course_mappings ?? [],
    courseCTA:      row.course_cta ?? '',
    newsletter:     row.newsletter ?? {},
    quiz:           row.quiz ?? {},
    aiHints:        row.ai_hints ?? {},
    trust:          row.trust ?? {},
    discussion:     row.discussion ?? {},
    advanced:       row.advanced ?? {},
    author:         authorsMap[row.author_id] ?? null,
  }));
}

/** Fetch all published posts, newest first */
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'Published')
    .order('id', { ascending: false });

  if (error) {
    console.error('[data.server] getPosts error:', error.message);
    return [];
  }
  return mapPosts(data);
}

/** Fetch a single post by slug */
export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[data.server] getPostBySlug error:', error.message);
    }
    return null;
  }
  return (await mapPosts([data]))[0];
}

/** Count published posts by a given author */
export async function getAuthorPostCount(authorId) {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', authorId)
    .eq('status', 'Published');
  if (error) return 0;
  return count ?? 0;
}

/** Return slugs of all published posts — used for generateStaticParams */
export async function getAllSlugs() {
  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'Published');

  if (error) return [];
  return data.map(r => r.slug);
}

/** Recommendations based on domain_tags + skill_level overlap */
export async function getRecommendations(currentSlug, limit = 3) {
  const posts = await getPosts();
  const current = posts.find(p => p.slug === currentSlug);
  if (!current) return posts.slice(0, limit);

  const getOverlap = (a, b) => (a && b ? a.filter(t => b.includes(t)).length : 0);

  return posts
    .filter(p => p.slug !== currentSlug)
    .map(p => ({
      ...p,
      _score: getOverlap(p.domain_tags, current.domain_tags) * 2 +
              (p.skill_level === current.skill_level ? 1 : 0),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

/** Search posts by query, topic filter, skill filter */
export async function searchPosts(query = '', activeTopic = null, activeSkill = null) {
  let qb = supabase.from('posts').select('*').eq('status', 'Published');

  if (activeTopic) {
    // domain_tags is a text[] column — use the overlap operator
    qb = qb.contains('domain_tags', [activeTopic]);
  }
  if (activeSkill) {
    qb = qb.eq('skill_level', activeSkill);
  }

  const { data, error } = await qb.order('id', { ascending: false });
  if (error) {
    console.error('[data.server] searchPosts error:', error.message);
    return [];
  }

  let results = await mapPosts(data);

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.domain_tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return results;
}

/** Pure computation — no DB needed */
export function getCourseMatch(tags) {
  if (!tags || tags.length === 0) return courses[0];
  const getOverlap = (a, b) => a.filter(t => b.includes(t)).length;
  let best = courses[0], high = -1;
  for (const c of courses) {
    const score = getOverlap(c.domain_tags, tags);
    if (score > high) { high = score; best = c; }
  }
  return best;
}

/** Get all authors from Supabase (falls back to static) */
export async function getAuthors() {
  return getAuthorsMap();
}

// Re-export static helpers so server components only need one import
export { courses, salaryData };
export const authors = staticAuthors;
