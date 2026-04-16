import { NextResponse } from 'next/server';
import { getAllMdxPosts, mapMdxToPost } from '@/lib/mdx-posts';

export const dynamic = 'force-static';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || searchParams.get('topic');
  const q        = (searchParams.get('q') || '').toLowerCase();
  const skill    = searchParams.get('skill');
  const page     = parseInt(searchParams.get('page') || '1', 10);
  const limit    = parseInt(searchParams.get('limit') || '200', 10);

  let posts = getAllMdxPosts();

  // Category / topic filter
  if (category) {
    posts = posts.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === category.toLowerCase())
    );
  }

  // Text search
  if (q) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q))
    );
  }

  const total     = posts.length;
  const paginated = posts.slice((page - 1) * limit, page * limit);

  // Map to same shape as Supabase posts (no HTML content for listings)
  const mapped = paginated.map((p) => mapMdxToPost(p));

  return NextResponse.json(mapped);
}
