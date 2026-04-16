import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');
const POSTS_PER_PAGE = 20;

function readSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

function readPost(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    modified: data.modified || data.date || '',
    description: data.description || '',
    featuredImage: data.featuredImage || '/images/placeholder.jpg',
    author: data.author || '',
    categories: Array.isArray(data.categories) ? data.categories : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    canonical: data.canonical || '',
    noindex: data.noindex !== false,
    content,
  };
}

export async function markdownToHtml(markdown) {
  const result = await remark()
    .use(remarkGfm)
    .use(html, { sanitize: false })
    .process(markdown);
  return result.toString();
}

export function getAllSlugs() {
  return readSlugs();
}

export function getAllPosts() {
  return readSlugs()
    .map((slug) => {
      const post = readPost(slug);
      if (!post) return null;
      const { content: _content, ...meta } = post;
      return meta;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug) {
  return readPost(slug);
}

export function getPaginatedPosts(page = 1) {
  const all = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const posts = all.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  return { posts, total: all.length, totalPages, currentPage };
}

export function getAllCategories() {
  const cats = new Set();
  getAllPosts().forEach((p) => p.categories.forEach((c) => cats.add(c)));
  return Array.from(cats).sort();
}

export function getPostsByCategory(category) {
  return getAllPosts().filter((p) =>
    p.categories.some((c) => c.toLowerCase() === category.toLowerCase())
  );
}

export function getPostsByTag(tag) {
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getRelatedPosts(slug, limit = 4) {
  const post = getAllPosts().find((p) => p.slug === slug);
  if (!post) return [];
  return getAllPosts()
    .filter(
      (p) =>
        p.slug !== slug &&
        p.categories.some((c) => post.categories.includes(c))
    )
    .slice(0, limit);
}
