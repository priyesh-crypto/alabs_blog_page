#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl: 'https://www.analytixlabs.co.in',
  sitemaps: ['https://www.analytixlabs.co.in/post-sitemap.xml'],
  outputDir: path.resolve(__dirname, '../nextjs-app/content/blog'),
  imagesDir: path.resolve(__dirname, '../nextjs-app/public/wp-content/uploads'),
  missingImagesFile: path.resolve(__dirname, '../missing-images.json'),
  errorsFile: path.resolve(__dirname, '../migration-errors.json'),
  placeholderImage: '/images/placeholder.jpg',
  delayMs: 600,
  concurrentImages: 5,
  timeout: 30_000,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Migration/1.0',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugFromUrl(url) {
  const u = new URL(url);
  let slug = u.pathname.replace(/^\/blog\//, '').replace(/\/$/, '');
  if (!slug) slug = u.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-');
  return slug || 'index';
}

function escapeYaml(str) {
  if (!str) return '""';
  if (/[:#\[\]{}&*!|>'"%@`?,\n]/.test(str) || str.trim() !== str) {
    return JSON.stringify(str);
  }
  return str;
}

function progressLine(i, total, slug, ok, errMsg) {
  const pct = Math.round(((i + 1) / total) * 100);
  const idx = String(i + 1).padStart(String(total).length, ' ');
  const mark = ok ? '\u2713' : '\u2717';
  const suffix = ok ? '' : ` ${errMsg}`;
  console.log(`[${idx}/${total}] (${pct}%) /blog/${slug} ${mark}${suffix}`);
}

// ── HTTP client ─────────────────────────────────────────────────────────────

const http = axios.create({
  timeout: CONFIG.timeout,
  headers: { 'User-Agent': CONFIG.userAgent },
  maxRedirects: 5,
});

// ── Sitemap fetcher ─────────────────────────────────────────────────────────

async function fetchSitemapUrls() {
  const urls = [];
  for (const sitemapUrl of CONFIG.sitemaps) {
    const { data } = await http.get(sitemapUrl);
    const parsed = await xml2js.parseStringPromise(data);
    const entries = parsed.urlset && parsed.urlset.url ? parsed.urlset.url : [];
    for (const entry of entries) {
      const loc = Array.isArray(entry.loc) ? entry.loc[0] : entry.loc;
      if (loc) urls.push(loc.trim());
    }
  }
  return urls;
}

// ── Scraper ─────────────────────────────────────────────────────────────────

function extractMeta($, url) {
  const og = (prop) => $(`meta[property="og:${prop}"]`).attr('content') || '';
  const metaName = (name) => $(`meta[name="${name}"]`).attr('content') || '';
  const articleMeta = (prop) => $(`meta[property="article:${prop}"]`).attr('content') || '';

  let title = og('title') || $('h1').first().text().trim() || $('title').text().trim();
  title = title.replace(/\s*\|\s*AnalytixLabs\s*$/i, '').trim();

  const description = og('description') || metaName('description') || '';
  const featuredImage = og('image') || '';
  const publishedTime = articleMeta('published_time') || metaName('article:published_time') || '';
  const modifiedTime = articleMeta('modified_time') || metaName('article:modified_time') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || url;

  // Categories
  const categories = new Set();
  const sectionMeta = articleMeta('section');
  if (sectionMeta) categories.add(sectionMeta);
  $('a[rel="category tag"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) categories.add(text);
  });

  // Tags
  const tags = new Set();
  $('meta[property="article:tag"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content) tags.add(content.trim());
  });
  $('a[rel="tag"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) tags.add(text);
  });

  // Author
  const author =
    articleMeta('author') ||
    metaName('author') ||
    $('a[rel="author"]').first().text().trim() ||
    $('[class*="author-name"]').first().text().trim() ||
    'AnalytixLabs';

  return {
    title,
    description,
    featuredImage,
    publishedTime,
    modifiedTime,
    canonical,
    categories: [...categories],
    tags: [...tags],
    author,
  };
}

function extractContent($) {
  const selectors = [
    '.entry-content',
    '.post-content',
    'article .content',
    'main article .post-body',
  ];

  let $content = null;
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      $content = el;
      break;
    }
  }

  if (!$content) return '';

  // Remove WordPress noise
  const removeSelectors = [
    '.sharedaddy',
    '.jp-relatedposts',
    '.post-navigation',
    '.comments-area',
    '.widget',
    '[class*="subscribe"]',
    '[class*="newsletter"]',
    '[class*="social-share"]',
    '[class*="related-post"]',
    'script',
    'style',
    'noscript',
  ];
  for (const sel of removeSelectors) {
    $content.find(sel).remove();
  }

  return $content.html() || '';
}

// ── Turndown setup ──────────────────────────────────────────────────────────

function createTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  td.use(gfm);

  // Preserve iframes as JSX
  td.addRule('iframe', {
    filter: 'iframe',
    replacement(content, node) {
      const src = node.getAttribute('src') || '';
      const width = node.getAttribute('width') || '100%';
      const height = node.getAttribute('height') || '450';
      return `\n\n<iframe src="${src}" width="${width}" height="${height}" allowFullScreen />\n\n`;
    },
  });

  // Figure with optional caption
  td.addRule('figure', {
    filter: 'figure',
    replacement(content, node) {
      const img = node.querySelector('img');
      if (!img) return content;
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const figcaption = node.querySelector('figcaption');
      let md = `![${alt}](${src})`;
      if (figcaption) {
        const captionText = figcaption.textContent.trim();
        if (captionText) md += `\n*${captionText}*`;
      }
      return `\n\n${md}\n\n`;
    },
  });

  // Strip empty links
  td.addRule('emptyLink', {
    filter(node) {
      return node.nodeName === 'A' && !node.textContent.trim() && !node.querySelector('img');
    },
    replacement() {
      return '';
    },
  });

  return td;
}

// ── Image downloader ────────────────────────────────────────────────────────

async function downloadImage(imageUrl, missingImages, postSlug) {
  try {
    const parsed = new URL(imageUrl, CONFIG.baseUrl);
    const urlPath = parsed.pathname; // e.g. /wp-content/uploads/2023/01/img.jpg

    if (!urlPath.includes('/wp-content/uploads/')) return;

    const localRelative = urlPath; // keep /wp-content/uploads/...
    const localAbsolute = path.join(
      path.resolve(__dirname, '../nextjs-app/public'),
      localRelative
    );

    if (await fs.pathExists(localAbsolute)) return;

    await fs.ensureDir(path.dirname(localAbsolute));

    const response = await http.get(parsed.href, { responseType: 'arraybuffer', timeout: 30_000 });
    await fs.writeFile(localAbsolute, response.data);
  } catch (err) {
    missingImages.push({
      post: postSlug,
      imageUrl,
      error: err.message,
    });
  }
}

async function downloadImagesInBatches(imageUrls, missingImages, postSlug) {
  const unique = [...new Set(imageUrls)];
  for (let i = 0; i < unique.length; i += CONFIG.concurrentImages) {
    const batch = unique.slice(i, i + CONFIG.concurrentImages);
    await Promise.all(batch.map((u) => downloadImage(u, missingImages, postSlug)));
  }
}

// ── Collect image URLs from HTML ────────────────────────────────────────────

function collectImageUrls($content, $, featuredImage) {
  const urls = [];
  if (featuredImage && featuredImage.includes('/wp-content/uploads/')) {
    urls.push(featuredImage);
  }
  // Use cheerio to find images in content HTML
  const contentHtml = typeof $content === 'string' ? $content : '';
  const $c = cheerio.load(contentHtml);
  $c('img').each((_, el) => {
    const src = $c(el).attr('src') || '';
    if (src.includes('/wp-content/uploads/')) urls.push(src);
    const srcset = $c(el).attr('srcset') || '';
    const matches = srcset.match(/https?:\/\/[^\s,]+/g);
    if (matches) urls.push(...matches.filter((u) => u.includes('/wp-content/uploads/')));
  });
  return urls;
}

// ── MDX writer ──────────────────────────────────────────────────────────────

function buildFrontmatter(meta, slug) {
  const cats = meta.categories.map((c) => `  - ${escapeYaml(c)}`).join('\n');
  const tagList = meta.tags.map((t) => `  - ${escapeYaml(t)}`).join('\n');

  let fm = '---\n';
  fm += `title: ${escapeYaml(meta.title)}\n`;
  fm += `slug: ${escapeYaml(slug)}\n`;
  fm += `date: ${escapeYaml(meta.publishedTime)}\n`;
  fm += `modified: ${escapeYaml(meta.modifiedTime)}\n`;
  fm += `description: ${escapeYaml(meta.description)}\n`;
  fm += `featuredImage: ${escapeYaml(meta.featuredImage || CONFIG.placeholderImage)}\n`;
  fm += `author: ${escapeYaml(meta.author)}\n`;
  fm += `categories:\n${cats || '  - Uncategorized'}\n`;
  fm += `tags:\n${tagList || '  - general'}\n`;
  fm += `canonical: ${escapeYaml(meta.canonical)}\n`;
  fm += `noindex: true\n`;
  fm += '---\n';
  return fm;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const resumeMode = process.argv.includes('--resume');

  await fs.ensureDir(CONFIG.outputDir);
  await fs.ensureDir(CONFIG.imagesDir);

  // Load existing slugs for resume
  let existingSlugs = new Set();
  if (resumeMode) {
    const files = await fs.readdir(CONFIG.outputDir).catch(() => []);
    for (const f of files) {
      if (f.endsWith('.mdx')) existingSlugs.add(f.replace(/\.mdx$/, ''));
    }
    console.log(`Resume mode: ${existingSlugs.size} posts already migrated, skipping them.`);
  }

  console.log('Fetching sitemap...');
  const urls = await fetchSitemapUrls();
  console.log(`Found ${urls.length} URLs in sitemap.\n`);

  const td = createTurndown();
  const missingImages = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = slugFromUrl(url);

    if (resumeMode && existingSlugs.has(slug)) {
      progressLine(i, urls.length, slug, true, '');
      continue;
    }

    try {
      const { data: html } = await http.get(url);
      const $ = cheerio.load(html);

      const meta = extractMeta($, url);
      const contentHtml = extractContent($);

      if (!contentHtml) {
        throw new Error('No content element found');
      }

      // Collect and download images
      const imageUrls = collectImageUrls(contentHtml, $, meta.featuredImage);
      await downloadImagesInBatches(imageUrls, missingImages, slug);

      // Convert to MDX
      const mdxBody = td.turndown(contentHtml);
      const frontmatter = buildFrontmatter(meta, slug);
      const mdxContent = `${frontmatter}\n${mdxBody}\n`;

      const outputPath = path.join(CONFIG.outputDir, `${slug}.mdx`);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, mdxContent, 'utf-8');

      progressLine(i, urls.length, slug, true, '');
    } catch (err) {
      const msg = err.message || String(err);
      errors.push({ url, slug, error: msg });
      progressLine(i, urls.length, slug, false, msg);
    }

    // Polite delay
    if (i < urls.length - 1) await sleep(CONFIG.delayMs);
  }

  // Write reports
  await fs.writeJson(CONFIG.missingImagesFile, missingImages, { spaces: 2 });
  await fs.writeJson(CONFIG.errorsFile, errors, { spaces: 2 });

  console.log(`\n── Done ──`);
  console.log(`  Posts migrated: ${urls.length - errors.length}`);
  console.log(`  Errors:         ${errors.length}`);
  console.log(`  Missing images: ${missingImages.length}`);
  if (errors.length) console.log(`  See ${CONFIG.errorsFile}`);
  if (missingImages.length) console.log(`  See ${CONFIG.missingImagesFile}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
