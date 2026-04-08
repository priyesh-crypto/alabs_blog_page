'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

// ── Slug helpers ──────────────────────────────────────────────────
function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Alt text validation ──────────────────────────────────────────
function validateAltText(image, altText) {
  if (!image) return null; // no image = no alt needed
  if (!altText || typeof altText !== 'string') return 'Alt text is required for SEO';
  const trimmed = altText.trim();
  if (trimmed.length < 5) return 'Alt text must be at least 5 characters';
  if (trimmed.length > 150) return 'Alt text must be 150 characters or less';
  return null; // valid
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
    image:           payload.image ?? '',
    alt_text:        payload.alt_text ?? '',
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

// ── Auth helper: verify session + return author slug ─────────────
// Returns { slug } on success, throws on failure.
async function getCallerSlug() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Unauthorized');

  const db = getServiceClient();
  const { data: author } = await db
    .from('authors')
    .select('slug, is_super_admin')
    .ilike('email', user.email)
    .maybeSingle();

  // Allow super-admins to act on any post; regular authors only their own
  return { slug: author?.slug || null, isSuperAdmin: author?.is_super_admin === true };
}

// ── Snapshot helper (save current post state as a version) ────────
async function snapshotVersion(db, postId) {
  // Fetch current post data
  const { data: current, error: fetchErr } = await db
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();
  if (fetchErr || !current) return; // silently skip if post doesn't exist

  // Get next version number
  const { data: latest } = await db
    .from('post_versions')
    .select('version_number')
    .eq('post_id', postId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version_number ?? 0) + 1;

  await db.from('post_versions').insert({
    post_id:         postId,
    title:           current.title,
    content:         current.content,
    excerpt:         current.excerpt,
    category:        current.category,
    domain_tags:     current.domain_tags,
    skill_level:     current.skill_level,
    image:           current.image,
    alt_text:        current.alt_text ?? '',
    seo:             current.seo,
    course_mappings: current.course_mappings,
    course_cta:      current.course_cta,
    newsletter:      current.newsletter,
    quiz:            current.quiz,
    ai_hints:        current.ai_hints,
    trust:           current.trust,
    discussion:      current.discussion,
    advanced:        current.advanced,
    updated_by:      current.author_id || 'al-editorial',
    version_number:  nextVersion,
  });
}

// ── publishPostAction ─────────────────────────────────────────────
export async function publishPostAction(payload) {
  try {
    const { slug: callerSlug } = await getCallerSlug();
    const db = getServiceClient();

    // Validate alt text
    const altErr = validateAltText(payload.image, payload.alt_text);
    if (altErr) return { success: false, error: altErr };

    // Ensure author_id is always a valid slug, never a UUID
    if (payload.authorId) payload = { ...payload, authorId: callerSlug || payload.authorId };

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
    return { success: false, error: 'Failed to publish post. Please try again.' };
  }
}

// ── updatePostAction ──────────────────────────────────────────────
export async function updatePostAction(id, payload) {
  try {
    const { slug: callerSlug, isSuperAdmin } = await getCallerSlug();
    const db = getServiceClient();

    // Validate alt text
    const altErr = validateAltText(payload.image, payload.alt_text);
    if (altErr) return { success: false, error: altErr };

    // Fetch original to verify ownership + preserve publishedAt
    const { data: original, error: fetchErr } = await db
      .from('posts')
      .select('slug, published_at, status, author_id')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    // Ownership check: only the post author or a super admin can update
    if (!isSuperAdmin && original.author_id !== callerSlug) {
      return { success: false, error: 'Forbidden: you do not own this post.' };
    }

    // ★ Snapshot current version before overwriting
    await snapshotVersion(db, id);

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
      status:       original.status || 'Published',
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
    return { success: false, error: 'Failed to update post. Please try again.' };
  }
}

// ── deletePostAction ──────────────────────────────────────────────
export async function deletePostAction(id) {
  try {
    const { slug: callerSlug, isSuperAdmin } = await getCallerSlug();
    const db = getServiceClient();

    const { data: post, error: fetchErr } = await db
      .from('posts')
      .select('slug, author_id')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    if (!isSuperAdmin && post.author_id !== callerSlug) {
      return { success: false, error: 'Forbidden: you do not own this post.' };
    }

    // Versions cascade-delete automatically via foreign key
    const { error } = await db.from('posts').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${post.slug}`);
    return { success: true };
  } catch (error) {
    console.error('deletePostAction failed:', error);
    return { success: false, error: 'Failed to delete post. Please try again.' };
  }
}

// ── togglePostStatusAction ────────────────────────────────────────
export async function togglePostStatusAction(id) {
  try {
    const { slug: callerSlug, isSuperAdmin } = await getCallerSlug();
    const db = getServiceClient();

    const { data: post, error: fetchErr } = await db
      .from('posts')
      .select('status, slug, author_id')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    if (!isSuperAdmin && post.author_id !== callerSlug) {
      return { success: false, error: 'Forbidden: you do not own this post.' };
    }

    const newStatus = post.status === 'Published' ? 'Draft' : 'Published';
    const updates = {
      status: newStatus,
      updated_at: formatDate(),
    };
    // Set published_at when publishing
    if (newStatus === 'Published') {
      updates.published_at = formatDate();
    }

    const { error } = await db.from('posts').update(updates).eq('id', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${post.slug}`);
    return { success: true, newStatus };
  } catch (error) {
    console.error('togglePostStatusAction failed:', error);
    return { success: false, error: 'Failed to update post status. Please try again.' };
  }
}

// ── schedulePostAction ────────────────────────────────────────────
export async function schedulePostAction(payload, scheduledDate) {
  try {
    const { slug: callerSlug } = await getCallerSlug();
    const db = getServiceClient();

    // Ensure author_id is always a valid slug
    if (payload.authorId) payload = { ...payload, authorId: callerSlug || payload.authorId };

    const slug = payload.slug || toSlug(payload.title);

    // Validate and format the scheduled date
    const parsedDate = scheduledDate ? new Date(scheduledDate) : null;
    const isValidDate = parsedDate && !isNaN(parsedDate.getTime()) && parsedDate > new Date();
    const publishedAt = isValidDate
      ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Scheduled';

    const row = {
      ...toRow({ ...payload, slug }),
      status:       'Scheduled',
      published_at: publishedAt,
      updated_at:   formatDate(),
    };

    const { error } = await db.from('posts').insert(row);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/article');
    return { success: true, slug };
  } catch (error) {
    console.error('schedulePostAction failed:', error);
    return { success: false, error: 'Failed to schedule post. Please try again.' };
  }
}

// ── fetchVersionsAction ───────────────────────────────────────────
export async function fetchVersionsAction(postId) {
  try {
    await getCallerSlug(); // require auth
    const db = getServiceClient();

    const { data, error } = await db
      .from('post_versions')
      .select('id, post_id, title, content, excerpt, category, domain_tags, skill_level, image, alt_text, seo, course_mappings, course_cta, newsletter, quiz, ai_hints, trust, discussion, advanced, updated_by, version_number, created_at')
      .eq('post_id', postId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    const versions = (data || []).map((v) => ({
      ...v,
      createdAt: v.created_at,
      updatedBy: v.updated_by,
      versionNumber: v.version_number,
    }));

    return { success: true, versions };
  } catch (error) {
    console.error('fetchVersionsAction failed:', error);
    return { success: true, versions: [] };
  }
}

// ── restoreVersionAction ──────────────────────────────────────────
export async function restoreVersionAction(postId, versionId) {
  try {
    const { slug: callerSlug, isSuperAdmin } = await getCallerSlug();
    const db = getServiceClient();

    // Ownership check on the post before restoring
    const { data: postCheck } = await db
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();
    if (postCheck && !isSuperAdmin && postCheck.author_id !== callerSlug) {
      return { success: false, error: 'Forbidden: you do not own this post.' };
    }

    // Fetch the version to restore
    const { data: ver, error: verErr } = await db
      .from('post_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (verErr) throw verErr;

    // Snapshot CURRENT post state before restoring (never overwrite history)
    await snapshotVersion(db, postId);

    // Overwrite the post with version data
    const { error: updateErr } = await db.from('posts').update({
      title:           ver.title,
      content:         ver.content,
      excerpt:         ver.excerpt,
      category:        ver.category,
      domain_tags:     ver.domain_tags,
      skill_level:     ver.skill_level,
      image:           ver.image,
      alt_text:        ver.alt_text,
      seo:             ver.seo,
      course_mappings: ver.course_mappings,
      course_cta:      ver.course_cta,
      newsletter:      ver.newsletter,
      quiz:            ver.quiz,
      ai_hints:        ver.ai_hints,
      trust:           ver.trust,
      discussion:      ver.discussion,
      advanced:        ver.advanced,
      updated_at:      formatDate(),
    }).eq('id', postId);
    if (updateErr) throw updateErr;

    // Fetch updated post to return
    const { data: updated } = await db
      .from('posts')
      .select('slug')
      .eq('id', postId)
      .single();

    revalidatePath('/');
    revalidatePath('/article');
    if (updated) revalidatePath(`/article/${updated.slug}`);
    return { success: true, restoredVersion: ver.version_number };
  } catch (error) {
    console.error('restoreVersionAction failed:', error);
    return { success: false, error: 'Failed to restore version. Please try again.' };
  }
}

// ── subscribeAction ───────────────────────────────────────────────
export async function subscribeAction({ email, name = '', source = 'newsletter' }) {
  try {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { success: false, error: 'A valid email is required.' };
    }

    const db = getServiceClient();

    const { error } = await db.from('subscribers').upsert(
      { email: email.trim().toLowerCase(), name: name.trim(), source },
      { onConflict: 'email', ignoreDuplicates: true }
    );

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('subscribeAction failed:', error);
    // Don't reveal DB details to client
    if (error.code === '23505') return { success: true }; // already subscribed
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// ── postCommentAction ─────────────────────────────────────────────
export async function postCommentAction({ postSlug, userName, text, parentCommentId = null }) {
  try {
    if (!postSlug || !text?.trim()) {
      return { success: false, error: 'Comment text is required.' };
    }

    const db = getServiceClient();

    const row = {
      post_slug: postSlug,
      user_name: (userName || 'Anonymous').trim().slice(0, 50),
      text: text.trim().slice(0, 2000),
      parent_comment_id: parentCommentId || null,
      likes: 0,
    };

    const { data, error } = await db.from('comments').insert(row).select().single();
    if (error) throw error;

    return {
      success: true,
      comment: {
        id: data.id,
        user: data.user_name,
        text: data.text,
        likes: data.likes,
        time: 'Just now',
        parentCommentId: data.parent_comment_id,
        createdAt: data.created_at,
        replies: [],
      },
    };
  } catch (error) {
    console.error('postCommentAction failed:', error);
    return { success: false, error: 'Failed to post comment.' };
  }
}

// ── likeCommentAction ─────────────────────────────────────────────
export async function likeCommentAction(commentId, delta = 1) {
  try {
    const db = getServiceClient();

    // Fetch current likes
    const { data: current, error: fetchErr } = await db
      .from('comments')
      .select('likes')
      .eq('id', commentId)
      .single();
    if (fetchErr) throw fetchErr;

    const newLikes = Math.max(0, (current.likes || 0) + delta);

    const { error } = await db
      .from('comments')
      .update({ likes: newLikes })
      .eq('id', commentId);
    if (error) throw error;

    return { success: true, likes: newLikes };
  } catch (error) {
    console.error('likeCommentAction failed:', error);
    return { success: false, error: 'Failed to like comment.' };
  }
}

// ── fetchCommentsAction ───────────────────────────────────────────
export async function fetchCommentsAction(postSlug) {
  try {
    if (!postSlug) return { success: true, comments: [] };

    const db = getServiceClient();

    const { data, error } = await db
      .from('comments')
      .select('*')
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Build nested tree: separate top-level from replies
    const topLevel = [];
    const replyMap = {};

    for (const row of data || []) {
      const comment = {
        id: row.id,
        user: row.user_name,
        text: row.text,
        likes: row.likes || 0,
        time: formatRelativeTime(row.created_at),
        parentCommentId: row.parent_comment_id,
        createdAt: row.created_at,
        replies: [],
      };
      if (row.parent_comment_id) {
        if (!replyMap[row.parent_comment_id]) replyMap[row.parent_comment_id] = [];
        replyMap[row.parent_comment_id].push(comment);
      } else {
        topLevel.push(comment);
      }
    }

    // Attach replies to parents
    for (const c of topLevel) {
      c.replies = (replyMap[c.id] || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }

    return { success: true, comments: topLevel };
  } catch (error) {
    console.error('fetchCommentsAction failed:', error);
    return { success: true, comments: [] }; // graceful fallback
  }
}

// ── Time formatting helper ────────────────────────────────────────
function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── adminCreateUserAction ─────────────────────────────────────────
export async function adminCreateUserAction({ 
  email, name, password, role, 
  bio = '', linkedin = '', experience = '', expertise = '', image = '' 
}) {
  try {
    if (!email || !password || !name) {
      return { success: false, error: 'Email, name, and password are required.' };
    }

    // 1. Verify Requesting User's Auth and Super Admin Status
    const supabaseSession = await createClient();
    const { data: { user }, error: authErr } = await supabaseSession.auth.getUser();
    
    if (authErr || !user) {
      return { success: false, error: 'Unauthorized: Not logged in.' };
    }

    // Connect DB to check role
    const db = getServiceClient(); // We use service client to ensure we can read all data
    const { data: requestor, error: reqErr } = await db
      .from('authors')
      .select('is_super_admin')
      .ilike('email', user.email)
      .maybeSingle();

    if (reqErr || !requestor?.is_super_admin) {
      return { success: false, error: 'Forbidden: You must be a Super Admin to perform this action.' };
    }

    // 2. Provision new user in Supabase Auth using Service Role bypass
    const { error: createUserErr } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createUserErr) {
      // If user already exists in auth, we fallback to just upserting them into authors gracefully
      if (!createUserErr.message.includes('already exists')) {
         throw createUserErr;
      }
    }

    // 3. Create or update Author Record
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();
    const isSuperAdmin = role === 'admin';

    // Check if this author already exists so we never downgrade an existing super admin
    const { data: existingAuthor } = await db
      .from('authors')
      .select('slug, is_super_admin')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Preserve super admin if the existing record already has it
    const finalIsSuperAdmin = existingAuthor?.is_super_admin ? true : isSuperAdmin;
    // Reuse existing slug if present, otherwise generate a new one
    const slug = existingAuthor?.slug || (toSlug(name) + '-' + Math.floor(Math.random() * 1000));

    const row = {
      slug,
      name,
      email: normalizedEmail,
      is_super_admin: finalIsSuperAdmin,
      initials,
      color: '#0f2554',
      bio,
      linkedin,
      experience,
      expertise: expertise.split(',').map(t => t.trim()).filter(Boolean),
      image
    };

    const { error: dbErr } = await db
      .from('authors')
      .upsert(row, { onConflict: 'email', ignoreDuplicates: false });

    if (dbErr) throw dbErr;

    return { success: true };
  } catch (error) {
    console.error('adminCreateUserAction failed:', error);
    return { success: false, error: 'Failed to create user. Please try again.' };
  }
}

// ── updateAuthorProfileAction ────────────────────────────────────
export async function updateAuthorProfileAction({ name, bio, linkedin, experience, expertise, image }) {
  try {
    const supabaseSession = await createClient();
    const { data: { user }, error: authErr } = await supabaseSession.auth.getUser();
    
    if (authErr || !user) {
      return { success: false, error: 'Unauthorized: Not logged in.' };
    }

    const db = getServiceClient();
    
    // We update the author row where email matches the current user
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    
    const { error } = await db
      .from('authors')
      .update({
        name,
        initials,
        bio,
        linkedin,
        experience,
        expertise: (expertise || '').split(',').map(t => t.trim()).filter(Boolean),
        image,
      })
      .ilike('email', user.email);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('updateAuthorProfileAction failed:', error);
    return { success: false, error: 'Failed to update profile. Please try again.' };
  }
}
