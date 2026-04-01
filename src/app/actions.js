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
    
    const newPost = {
      ...payload,
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
