'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const getFilePath = () => path.join(process.cwd(), 'src/lib/posts.json');

export async function publishPostAction(payload) {
  try {
    const filePath = getFilePath();
    const fileData = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileData);

    const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 0;

    // Deduplicate slug — append id if collision
    let finalSlug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (posts.some(p => p.slug === finalSlug)) {
      finalSlug = `${finalSlug}-${newId}`;
    }

    const newPost = {
      ...payload,
      slug: finalSlug,
      id: newId,
      authorId: payload.authorId || "al-editorial",
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Published",
      image: payload.image || "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2000&auto=format&fit=crop"
    };

    posts.unshift(newPost);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${newPost.slug}`);
    return { success: true, slug: newPost.slug };
  } catch (error) {
    console.error("Failed to publish post:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePostAction(id, payload) {
  try {
    const filePath = getFilePath();
    const fileData = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileData);

    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, error: "Post not found" };

    const existing = posts[idx];

    // If slug changed, check for collision with other posts
    let finalSlug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const slugCollision = posts.some(p => p.slug === finalSlug && p.id !== id);
    if (slugCollision) finalSlug = `${finalSlug}-${id}`;

    posts[idx] = {
      ...existing,
      ...payload,
      slug: finalSlug,
      id: existing.id,
      publishedAt: existing.publishedAt,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Published",
    };

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    revalidatePath('/');
    revalidatePath('/article');
    revalidatePath(`/article/${finalSlug}`);
    if (existing.slug !== finalSlug) revalidatePath(`/article/${existing.slug}`);
    return { success: true, slug: finalSlug };
  } catch (error) {
    console.error("Failed to update post:", error);
    return { success: false, error: error.message };
  }
}

export async function schedulePostAction(payload) {
  try {
    const filePath = getFilePath();
    const fileData = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileData);

    const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 0;
    
    const newPost = {
      ...payload,
      id: newId,
      authorId: payload.authorId || "al-editorial",
      publishedAt: "Scheduled for later",
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Scheduled",
      title: `[SCHEDULED] ${payload.title}`,
      image: payload.image || "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=2000&auto=format&fit=crop"
    };

    posts.unshift(newPost);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    revalidatePath('/');
    revalidatePath('/article');
    return { success: true, slug: newPost.slug };
  } catch (error) {
    console.error("Failed to schedule post:", error);
    return { success: false, error: error.message };
  }
}
