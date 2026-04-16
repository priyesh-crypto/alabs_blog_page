import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";

const POSTS_PER_PAGE = 20;
const contentDir = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  modified: string;
  description: string;
  featuredImage: string;
  author: string;
  categories: string[];
  tags: string[];
  canonical: string;
  noindex: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

function readAllPosts(): Post[] {
  if (!fs.existsSync(contentDir)) return [];

  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"));

  return files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(contentDir, filename), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? "",
      date: data.date ?? "",
      modified: data.modified ?? data.date ?? "",
      description: data.description ?? "",
      featuredImage: data.featuredImage ?? "",
      author: data.author ?? "",
      categories: data.categories ?? [],
      tags: data.tags ?? [],
      canonical: data.canonical ?? "",
      noindex: data.noindex ?? false,
      content,
    };
  });
}

export const getAllSlugs = cache((): string[] => {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
});

export const getAllPosts = cache((): PostMeta[] => {
  return readAllPosts()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(({ content: _, ...meta }) => meta);
});

export const getPostBySlug = cache((slug: string): Post | null => {
  const filePath = path.join(contentDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? "",
    date: data.date ?? "",
    modified: data.modified ?? data.date ?? "",
    description: data.description ?? "",
    featuredImage: data.featuredImage ?? "",
    author: data.author ?? "",
    categories: data.categories ?? [],
    tags: data.tags ?? [],
    canonical: data.canonical ?? "",
    noindex: data.noindex ?? false,
    content,
  };
});

export const getPaginatedPosts = cache(
  (
    page: number
  ): {
    posts: PostMeta[];
    total: number;
    totalPages: number;
    currentPage: number;
  } => {
    const all = getAllPosts();
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    const posts = all.slice(start, start + POSTS_PER_PAGE);

    return { posts, total, totalPages, currentPage };
  }
);

export const getAllCategories = cache((): string[] => {
  const cats = new Set<string>();
  getAllPosts().forEach((p) => p.categories.forEach((c) => cats.add(c)));
  return Array.from(cats).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
});

export const getPostsByCategory = cache((category: string): PostMeta[] => {
  const lower = category.toLowerCase();
  return getAllPosts().filter((p) =>
    p.categories.some((c) => c.toLowerCase() === lower)
  );
});

export const getPostsByTag = cache((tag: string): PostMeta[] => {
  const lower = tag.toLowerCase();
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === lower)
  );
});

export const getRelatedPosts = cache(
  (slug: string, limit: number = 4): PostMeta[] => {
    const post = getPostBySlug(slug);
    if (!post) return [];

    const categories = post.categories.map((c) => c.toLowerCase());
    return getAllPosts()
      .filter(
        (p) =>
          p.slug !== slug &&
          p.categories.some((c) => categories.includes(c.toLowerCase()))
      )
      .slice(0, limit);
  }
);
