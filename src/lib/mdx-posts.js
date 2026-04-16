import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');

/** Read and parse all MDX files, sorted newest-first */
export function getAllMdxPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const { data, content } = matter(raw);
      return {
        slug:         data.slug || f.replace('.mdx', ''),
        title:        data.title || '',
        date:         data.date || '',
        modified:     data.modified || '',
        description:  data.description || '',
        featuredImage: data.featuredImage || '/images/placeholder.jpg',
        author:       data.author || 'AnalytixLabs',
        categories:   Array.isArray(data.categories) ? data.categories : [],
        tags:         Array.isArray(data.tags) ? data.tags : [],
        canonical:    data.canonical || '',
        content,
        source:       'wordpress',
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Get a single MDX post by slug */
export function getMdxPostBySlug(slug) {
  return getAllMdxPosts().find((p) => p.slug === slug) || null;
}

/** Convert markdown content to HTML */
export async function mdxToHtml(markdown) {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return result.toString();
}

/** Format a date string to match Supabase's display format */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Calculate reading time from raw markdown text */
function calcReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

/**
/** All unique categories from MDX posts, sorted */
export function getMdxCategories() {
  const cats = new Set();
  getAllMdxPosts().forEach((p) => p.categories.forEach((c) => cats.add(c)));
  return Array.from(cats).sort();
}

/** MDX posts filtered by category (case-insensitive) */
export function getMdxPostsByCategory(category) {
  return getAllMdxPosts().filter((p) =>
    p.categories.some((c) => c.toLowerCase() === category.toLowerCase())
  );
}

/**
 * Map a raw MDX post to the same shape as Supabase posts returned by mapPost().
 * `htmlContent` is optional — pass it only when rendering the full article page.
 */
export function mapMdxToPost(mdxPost, htmlContent = null) {
  return {
    id:             `mdx-${mdxPost.slug}`,
    title:          mdxPost.title,
    slug:           mdxPost.slug,
    excerpt:        mdxPost.description,
    content:        htmlContent ?? mdxPost.content,
    category:       mdxPost.categories[0] || 'Data Science',
    domain_tags:    mdxPost.categories,
    skill_level:    null,
    readTime:       calcReadTime(mdxPost.content),
    authorId:       'analytixlabs',
    image:          mdxPost.featuredImage,
    status:         'Published',
    publishedAt:    formatDate(mdxPost.date),
    updatedAt:      formatDate(mdxPost.modified) || formatDate(mdxPost.date),
    seo:            {},
    courseMappings: [],
    courseCTA:      '',
    newsletter:     {},
    quiz:           {},
    aiHints:        {},
    trust:          {},
    discussion:     {},
    advanced:       {},
    likeCount:      0,
    source:         'wordpress',
    author: {
      slug:     'analytixlabs',
      name:     typeof mdxPost.author === 'string' ? mdxPost.author : 'AnalytixLabs',
      bio:      "India's leading data science training institute.",
      avatar:   '',
      position: 'Content Team',
      skills:   mdxPost.categories,
    },
  };
}
