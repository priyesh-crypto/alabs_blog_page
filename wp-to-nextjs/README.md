# WordPress → Next.js 14 Migration Toolkit

Migrates blog content from `https://www.analytixlabs.co.in` to a statically-generated Next.js 14 (App Router) site with MDX content.

## Project Structure

```
wp-to-nextjs/
├── README.md
├── scripts/
│   ├── migrate.js              # Scrapes WP site → MDX files + images
│   ├── validate-images.js      # Checks for missing image files
│   └── package.json
│
└── nextjs-app/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.mjs
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── middleware.ts
    ├── vercel.json
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── blog/
    │       ├── page.tsx                    # /blog listing with pagination
    │       ├── [slug]/
    │       │   └── page.tsx                # /blog/[slug] individual post
    │       └── category/
    │           └── [category]/
    │               └── page.tsx            # /blog/category/[category]
    ├── lib/
    │   └── posts.ts                        # MDX reader + query helpers
    ├── content/
    │   └── blog/                           # MDX files (populated by migration)
    └── public/
        ├── robots.txt
        ├── images/
        └── wp-content/
            └── uploads/                    # Downloaded images (populated by migration)
```

## SEO Lockdown (3 Layers)

This is a **staging/migration site** — it must NOT be indexed by search engines. Three independent layers ensure this:

| Layer | Mechanism | Files |
|-------|-----------|-------|
| 1 | `<meta name="robots" content="noindex, nofollow">` | `layout.tsx` + every `generateMetadata()` |
| 2 | `X-Robots-Tag: noindex, nofollow` HTTP header | `middleware.ts` + `next.config.mjs` + `vercel.json` |
| 3 | `robots.txt Disallow: /` | `public/robots.txt` |

### Re-enabling indexing for production

1. Remove `noindex` meta tags from `layout.tsx` and all `generateMetadata()` calls
2. Remove `X-Robots-Tag` headers from `middleware.ts`, `next.config.mjs`, and `vercel.json`
3. Update `public/robots.txt` to allow crawling and add a `Sitemap:` directive
4. Consider adding `next-sitemap` for automatic sitemap generation

## Migration Guide

### Step 1: Run the migration

```bash
cd scripts
npm install
npm run migrate
```

This will:
- Fetch all post URLs from the WordPress sitemap
- Scrape each post's content and metadata
- Download images to `nextjs-app/public/wp-content/uploads/`
- Generate MDX files in `nextjs-app/content/blog/`

Use `npm run migrate:resume` to resume an interrupted migration (skips already-migrated slugs).

### Step 2: Set up the Next.js app

```bash
cd nextjs-app
pnpm install
pnpm dev
```

Open `http://localhost:3000/blog` to preview the migrated content.

### Step 3: Validate images

```bash
cd scripts
npm run validate
```

This scans all MDX files for image references and checks they exist on disk. Outputs `missing-images.json` with repair suggestions.

### Step 4: Deploy

```bash
cd nextjs-app
pnpm build          # Verify build succeeds
vercel deploy       # Deploy to Vercel
```

## Handling Missing Images

After migration, some images may be missing. Options:

1. **Re-download**: Use the curl commands printed by `validate-images.js`
2. **AI-generated replacements**: Use the image descriptions to generate new images
3. **Placeholder**: Missing images fall back to `/images/placeholder.jpg`

## Example MDX Frontmatter

```yaml
---
title: "What is Data Science? A Complete Guide"
slug: "what-is-data-science"
date: "2024-01-15T10:30:00+05:30"
modified: "2024-03-20T14:00:00+05:30"
description: "Learn what data science is, its applications, and career opportunities."
featuredImage: "/wp-content/uploads/2024/01/data-science-guide.jpg"
author: "AnalytixLabs"
categories:
  - "Data Science"
  - "Career Guide"
tags:
  - "data science"
  - "machine learning"
  - "career"
canonical: "https://www.analytixlabs.co.in/blog/what-is-data-science"
noindex: true
---
```

## Key Commands

| Command | Location | Description |
|---------|----------|-------------|
| `npm run migrate` | `scripts/` | Run full migration |
| `npm run migrate:resume` | `scripts/` | Resume interrupted migration |
| `npm run validate` | `scripts/` | Validate image references |
| `pnpm dev` | `nextjs-app/` | Start dev server |
| `pnpm build` | `nextjs-app/` | Production build |
| `pnpm type-check` | `nextjs-app/` | TypeScript check |

## Customization

- **Posts per page**: Change `POSTS_PER_PAGE` in `lib/posts.ts` (default: 20)
- **Search**: Add client-side search with [fuse.js](https://fusejs.io/)
- **Sitemap**: Add [next-sitemap](https://github.com/iamvishnusankar/next-sitemap) when ready for production indexing
- **RSS feed**: Generate from `getAllPosts()` in a route handler
