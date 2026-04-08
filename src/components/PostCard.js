"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Reusable post card used in homepage grid, blog listing, and more.
 *
 * @param {{ post: object, bookmarked?: boolean, onToggleBookmark?: (slug:string)=>void, onShare?: (slug:string)=>void }} props
 */
export default function PostCard({ post, bookmarked = false, onToggleBookmark, onShare }) {
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden border bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754] hover:shadow-lg transition-shadow group">
      <div className="aspect-video relative bg-surface-container-high dark:bg-[#131b2e] overflow-hidden">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width:640px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline/20">image</span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-primary dark:text-[#adc6ff] font-[family-name:var(--font-label)] tracking-wide">
            {post.category}
          </span>
          <span className="text-[11px] text-on-surface-variant dark:text-[#8c909f] font-[family-name:var(--font-label)]">
            {post.readTime}
          </span>
        </div>
        <h3 className="font-[family-name:var(--font-headline)] font-bold text-[15px] leading-snug text-on-surface dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors">
          <Link href={`/article/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed line-clamp-2 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-outline-variant/10 dark:border-[#424754]">
          <div className="flex items-center gap-2">
            {post.author?.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || ""}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[8px]">
                {post.author?.initials || "?"}
              </div>
            )}
            <span className="text-xs text-on-surface-variant dark:text-[#c2c6d6]">
              {post.author?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(post.slug)}
                className="text-outline hover:text-primary dark:text-[#8c909f] dark:hover:text-[#adc6ff] transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{
                    fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  bookmark
                </span>
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(post.slug)}
                className="text-outline hover:text-primary dark:text-[#8c909f] dark:hover:text-[#adc6ff] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
