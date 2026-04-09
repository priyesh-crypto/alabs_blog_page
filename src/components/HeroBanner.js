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
      className="mt-16 pt-12 pb-16 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
    >
      {/* Featured image as background */}
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            opacity: 0.35,
            zIndex: 0,
          }}
        />
      )}
      <div className="max-w-7xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-3xl">
          <span className="glass-badge inline-block mb-5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
            Featured Analysis
          </span>
          <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-white leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-blue-100 text-base leading-relaxed mb-6 max-w-xl line-clamp-2">
              {post.excerpt}
            </p>
          )}
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
