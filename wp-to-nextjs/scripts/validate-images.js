#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const path = require('path');
const glob = require('path');

const CONTENT_DIR = path.resolve(__dirname, '../nextjs-app/content/blog');
const PUBLIC_DIR = path.resolve(__dirname, '../nextjs-app/public');
const MISSING_FILE = path.resolve(__dirname, '../missing-images.json');

async function getAllMdxFiles(dir) {
  const results = [];
  if (!(await fs.pathExists(dir))) return results;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await getAllMdxFiles(full)));
    } else if (entry.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

function findImageReferences(content) {
  const refs = [];

  // Markdown images: ![alt](/path)
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(content)) !== null) {
    const src = match[1].trim();
    if (src.startsWith('/')) refs.push(src);
  }

  // HTML img tags: <img src="/path" ...>
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1].trim();
    if (src.startsWith('/')) refs.push(src);
  }

  // Frontmatter featuredImage
  const fmRegex = /^featuredImage:\s*["']?([^\s"']+)["']?\s*$/m;
  match = fmRegex.exec(content);
  if (match) {
    const src = match[1].trim();
    if (src.startsWith('/') && src !== '/images/placeholder.jpg') refs.push(src);
  }

  return [...new Set(refs)];
}

function suggestFix(imagePath) {
  // Try to extract the original URL from the local path
  if (imagePath.includes('/wp-content/uploads/')) {
    return `https://www.analytixlabs.co.in${imagePath}`;
  }
  return null;
}

async function main() {
  console.log('Scanning MDX files for image references...\n');

  const files = await getAllMdxFiles(CONTENT_DIR);
  if (files.length === 0) {
    console.log(`No .mdx files found in ${CONTENT_DIR}`);
    console.log('Run the migration first: npm run migrate');
    return;
  }

  console.log(`Found ${files.length} MDX files.\n`);

  const missing = [];
  let totalRefs = 0;
  let totalMissing = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const postSlug = path.basename(file, '.mdx');
    const refs = findImageReferences(content);
    totalRefs += refs.length;

    for (const ref of refs) {
      const localPath = path.join(PUBLIC_DIR, ref);
      const exists = await fs.pathExists(localPath);
      if (!exists) {
        totalMissing++;
        const suggestion = suggestFix(ref);
        missing.push({
          post: postSlug,
          imagePath: ref,
          localPathExpected: localPath,
          suggestion: suggestion
            ? `curl -o "${localPath}" "${suggestion}"`
            : 'Manual download required',
        });
      }
    }
  }

  await fs.writeJson(MISSING_FILE, missing, { spaces: 2 });

  console.log(`Total image references: ${totalRefs}`);
  console.log(`Missing images:         ${totalMissing}`);
  console.log(`Report written to:      ${MISSING_FILE}\n`);

  if (missing.length > 0) {
    const showCount = Math.min(5, missing.length);
    console.log(`── Repair commands (first ${showCount}) ──\n`);
    for (let i = 0; i < showCount; i++) {
      const m = missing[i];
      if (m.suggestion.startsWith('curl')) {
        const dir = path.dirname(m.localPathExpected);
        console.log(`mkdir -p "${dir}" && \\`);
        console.log(`  ${m.suggestion}\n`);
      } else {
        console.log(`# ${m.post}: ${m.imagePath} — ${m.suggestion}\n`);
      }
    }

    if (missing.length > showCount) {
      console.log(`... and ${missing.length - showCount} more. See ${MISSING_FILE} for full list.`);
    }
  } else {
    console.log('All images present. No repairs needed.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
