'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase';

// ── Slug helpers ──────────────────────────────────────────────────
function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Payload → DB row mapping ──────────────────────────────────────
function toRow(payload) {
  return {
    title:           payload.title,
    slug:            payload.slug,
    excerpt:         payload.excerpt ?? '',
    content:         payload.content ?? '',
    category:        payload.category ?? '',
    domain_tags:     payload.domain_tags ?? [],
    skill_level:     payload.skill_level ?? 'Beginner',
    read_time:       payload.readTime ?? '',
    author_id:       payload.authorId ?? 'al-editorial',
    image:           payload.image ?? 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2000&auto=format&fit=crop',
    seo:             payload.seo ?? {},
    course_mappings: payload.courseMappings ?? [],
    course_cta:      payload.courseCTA ?? '',
    newsletter:      payload.newsletter ?? {},
    quiz:            payload.quiz ?? {},
    ai_hints:        payload.aiHints ?? {},
    trust:           payload.trust ?? {},
    discussion:      payload.discussion ?? {},
    advanced:        payload.advanced ?? {},
  };
}

// ── publishPostAction ─────────────────────────────────────────────
export async function publishPostAction(payload) {
  try {
    const db = getServiceClient();

    // Build and de-duplicate slug
    let slug = payload.slug || toSlug(payload.title);
    const { data: existing } = await db
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) slug = `${slug}-${Date.now()}`;

    const row = {
      ...toRow({ ...payload, slug }),
      status:       'Published',
      published_at: formatDate(),
      updated_at:   formatDate(),
    };

    const { data, error } = await db.from('posts').insert(row).select('slug').single();
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${data.slug}`);
    return { success: true, slug: data.slug };
  } catch (error) {
    console.error('publishPostAction failed:', error);
    return { success: false, error: error.message };
  }
}

// ── updatePostAction ──────────────────────────────────────────────
export async function updatePostAction(id, payload) {
  try {
    const db = getServiceClient();

    // Fetch original to preserve publishedAt + check old slug
    const { data: original, error: fetchErr } = await db
      .from('posts')
      .select('slug, published_at')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    // Resolve slug collision with other posts
    let slug = payload.slug || toSlug(payload.title);
    const { data: collision } = await db
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();
    if (collision) slug = `${slug}-${id}`;

    const row = {
      ...toRow({ ...payload, slug }),
      status:       'Published',
      published_at: original.published_at,
      updated_at:   formatDate(),
    };

    const { error } = await db.from('posts').update(row).eq('id', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${slug}`);
    if (original.slug !== slug) revalidatePath(`/article/${original.slug}`);
    return { success: true, slug };
  } catch (error) {
    console.error('updatePostAction failed:', error);
    return { success: false, error: error.message };
  }
}

// ── deletePostAction ──────────────────────────────────────────────
export async function deletePostAction(id) {
  try {
    const db = getServiceClient();

    const { data: post, error: fetchErr } = await db
      .from('posts')
      .select('slug')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const { error } = await db.from('posts').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${post.slug}`);
    return { success: true };
  } catch (error) {
    console.error('deletePostAction failed:', error);
    return { success: false, error: error.message };
  }
}

// ── schedulePostAction ────────────────────────────────────────────
export async function schedulePostAction(payload) {
  try {
    const db = getServiceClient();

    const slug = payload.slug || toSlug(payload.title);

    const row = {
      ...toRow({ ...payload, slug }),
      title:        `[SCHEDULED] ${payload.title}`,
      status:       'Scheduled',
      published_at: 'Scheduled for later',
      updated_at:   formatDate(),
    };

    const { error } = await db.from('posts').insert(row);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    return { success: true, slug };
  } catch (error) {
    console.error('schedulePostAction failed:', error);
    return { success: false, error: error.message };
  }
}
