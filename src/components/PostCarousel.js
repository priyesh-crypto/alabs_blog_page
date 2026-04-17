"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Horizontally-scrolling carousel of post cards.
 * Shows arrows + snap-scroll on desktop, native swipe on mobile.
 */
export default function PostCarousel({ title, posts = [], ctaHref, ctaLabel = "View all →" }) {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [posts.length]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (posts.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-4 gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] font-bold text-xl md:text-2xl text-on-background dark:text-[#dae2fd]">
            {title}
          </h2>
          <p className="text-xs text-on-surface-variant dark:text-[#8c909f] mt-0.5">
            {posts.length} article{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ctaHref && (
            <Link
              href={ctaHref}
              className="text-xs font-semibold text-primary dark:text-[#adc6ff] hover:underline whitespace-nowrap"
            >
              {ctaLabel}
            </Link>
          )}
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] transition-all ${canScrollLeft ? "hover:border-primary hover:text-primary dark:hover:border-[#adc6ff] dark:hover:text-[#adc6ff]" : "opacity-30 cursor-not-allowed"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] transition-all ${canScrollRight ? "hover:border-primary hover:text-primary dark:hover:border-[#adc6ff] dark:hover:text-[#adc6ff]" : "opacity-30 cursor-not-allowed"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {posts.map((post) => (
          <Link
            key={post.id || post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col snap-start shrink-0 w-[260px] sm:w-[280px] bg-white dark:bg-[#131b2e] rounded-2xl overflow-hidden border border-outline-variant/20 dark:border-[#424754] hover:border-primary/40 dark:hover:border-[#adc6ff]/40 hover:shadow-md transition-all"
          >
            <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="280px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-container/20" />
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              {post.category && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-[#adc6ff] mb-1">
                  {post.category}
                </span>
              )}
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-sm leading-snug text-on-background dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors line-clamp-2 mb-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-xs text-on-surface-variant dark:text-[#c2c6d6] line-clamp-2 flex-1">
                  {post.excerpt}
                </p>
              )}
              {post.readTime && (
                <span className="text-[11px] text-on-surface-variant/70 dark:text-[#8c909f] mt-2 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {post.readTime}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
