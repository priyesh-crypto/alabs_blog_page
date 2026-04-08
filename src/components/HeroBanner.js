"use client";

import Link from "next/link";

/**
 * Hero banner for the homepage and blog listing page.
 *
 * @param {{ post: object|null, bookmarked?: boolean, onToggleBookmark?: (slug:string)=>void }} props
 */
export default function HeroBanner({ post, bookmarked = false, onToggleBookmark }) {
  if (!post) return null;

  return (
    <section
      className="pt-24 pb-16"
      style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <span className="glass-badge inline-block mb-5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
            Featured Analysis
          </span>
          <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-white leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mb-8 text-blue-200 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {post.readTime}
            </span>
            {post.domain_tags?.[0] && (
              <span className="glass-badge px-2.5 py-1 rounded-full text-xs font-medium">
                {post.domain_tags[0]}
              </span>
            )}
            {post.updatedAt && (
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Updated {post.updatedAt}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/article/${post.slug}`}
              className="glass-btn px-6 py-3 rounded-full font-bold text-sm"
            >
              Read More
            </Link>
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(post.slug)}
                className="glass-btn px-6 py-3 rounded-full font-bold text-sm"
              >
                {bookmarked ? "Saved ✓" : "Save Article"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
