"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/Pagination";

const POSTS_PER_PAGE = 8;
const FEATURED_COUNT = 3;

export default function AuthorPostsList({ posts, authorName }) {
  const [search, setSearch]         = useState("");
  const [sort, setSort]             = useState("newest"); // newest | oldest | title
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, sort]);

  const firstName = authorName?.split(" ")[0] || "this author";

  // Top 3 most recent posts — the "Featured" section (always newest-first, regardless of sort)
  const featured = useMemo(() => {
    return [...posts]
      .sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
      .slice(0, FEATURED_COUNT);
  }, [posts]);
  const featuredIds = useMemo(() => new Set(featured.map((p) => p.id)), [featured]);

  // Filter + sort the full list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = posts.filter((p) => {
      if (!q) return true;
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.domain_tags || []).some((t) => (t || "").toLowerCase().includes(q))
      );
    });

    if (sort === "newest") {
      list.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt));
    } else if (sort === "oldest") {
      list.sort((a, b) => parseDate(a.publishedAt) - parseDate(b.publishedAt));
    } else if (sort === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [posts, search, sort]);

  // When NOT searching and NOT on a custom sort, hide Featured from the main list to avoid duplication
  const isSearching = !!search.trim();
  const mainList = (!isSearching && sort === "newest")
    ? filtered.filter((p) => !featuredIds.has(p.id))
    : filtered;

  const totalPages = Math.max(1, Math.ceil(mainList.length / POSTS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * POSTS_PER_PAGE;
  const paginated  = mainList.slice(startIdx, startIdx + POSTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      const el = document.getElementById("all-articles");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const showFeatured = !isSearching && sort === "newest" && featured.length > 0;

  return (
    <>
      {/* ── Featured Section (3 most recent) ── */}
      {showFeatured && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-2xl text-primary dark:text-[#adc6ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
              Latest &amp; Featured
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featured.map((post, idx) => (
              <PostCard key={post.id} post={post} featured idx={idx} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Articles ── */}
      <section id="all-articles">
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-outline-variant/10 dark:border-[#424754]/30">
          <span className="material-symbols-outlined text-2xl text-primary dark:text-[#adc6ff]">
            article
          </span>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            All Articles by {firstName}
          </h2>
          <span className="bg-surface-container-high dark:bg-[#222a3d] px-3 py-1 rounded-full text-xs font-bold">
            {posts.length}
          </span>

          {/* Search + Sort */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <div className="relative">
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 dark:text-[#8c909f] pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="pl-9 pr-8 py-2 rounded-full text-sm border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-background dark:text-[#dae2fd] outline-none focus:border-primary dark:focus:border-[#adc6ff] transition-colors w-56"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  title="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 dark:text-[#8c909f] hover:text-on-surface dark:hover:text-[#dae2fd]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-full text-sm border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-background dark:text-[#dae2fd] outline-none focus:border-primary dark:focus:border-[#adc6ff] transition-colors cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {mainList.length > 0 && (
          <p className="text-xs text-on-surface-variant dark:text-[#8c909f] mb-5">
            {isSearching
              ? `${mainList.length} match${mainList.length !== 1 ? "es" : ""} for "${search}"`
              : `Showing ${startIdx + 1}–${Math.min(startIdx + POSTS_PER_PAGE, mainList.length)} of ${mainList.length}${showFeatured ? ` (plus ${featured.length} featured above)` : ""}`}
          </p>
        )}

        {mainList.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 dark:text-[#424754] mb-3 inline-block">
              search_off
            </span>
            <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm">
              {isSearching ? `No articles found matching "${search}".` : "No articles yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginated.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-10"
            />
          </>
        )}
      </section>
    </>
  );
}

/* ---------- Helpers ---------- */

function parseDate(str) {
  if (!str) return 0;
  const t = new Date(str).getTime();
  return isNaN(t) ? 0 : t;
}

function PostCard({ post, featured = false, idx = 0 }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col bg-surface-container-lowest dark:bg-[#131b2e] rounded-3xl overflow-hidden hover:shadow-xl dark:hover:shadow-[#060e20]/50 transition-all border border-outline-variant/10 dark:border-[#424754]/20 hover:border-primary/40 dark:hover:border-[#adc6ff]/40 ${featured && idx === 0 ? "md:col-span-1" : ""}`}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
        {post.image ? (
          <Image
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src={post.image}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-container/30 dark:from-[#003b93]/30 dark:to-[#0051c3]/30" />
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          {featured && (
            <span className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md">
              New
            </span>
          )}
          {(post.domain_tags || []).slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="bg-white/90 dark:bg-[#0b1326]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-label)] font-bold tracking-widest uppercase text-on-surface dark:text-[#dae2fd]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-primary dark:text-[#adc6ff] font-bold">
            {post.category}
          </span>
          {post.readTime && (
            <span className="text-slate-500 dark:text-[#c2c6d6] text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              {post.readTime}
            </span>
          )}
        </div>
        <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg leading-snug group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd] mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
          {post.excerpt}
        </p>
        {post.publishedAt && (
          <time className="text-[11px] text-on-surface-variant/70 dark:text-[#8c909f] mt-auto">
            {post.publishedAt}
          </time>
        )}
      </div>
    </Link>
  );
}
