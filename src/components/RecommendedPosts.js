"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * "Recommended for you" sidebar list.
 *
 * @param {{ posts: object[] }} props
 */
export default function RecommendedPosts({ posts = [] }) {
  if (posts.length === 0) return null;

  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
      <h3 className="font-[family-name:var(--font-headline)] font-bold text-[15px] text-on-background dark:text-[#dae2fd] mb-4">
        Recommended for you
      </h3>
      <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/article/${post.slug}`}
            className="flex items-center gap-3 group py-3 first:pt-0 last:pb-0"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high dark:bg-[#131b2e] shrink-0 relative">
              {post.image ? (
                <Image src={post.image} alt="" fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-container-high dark:bg-[#222a3d]">
                  <span className="material-symbols-outlined text-sm text-outline/40">image</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-semibold leading-snug line-clamp-2 text-on-background dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors mb-1">
                {post.title}
              </h4>
              <span className="text-[11px] text-on-surface-variant dark:text-[#8c909f]">
                {post.readTime || "5 min read"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
