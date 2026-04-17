"use client";

import Link from "next/link";
import Image from "next/image";

export default function FeaturedSection({ posts = [] }) {
  if (posts.length === 0) return null;

  // Render top 3 featured posts
  const featuredPosts = posts.slice(0, 3);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] font-black text-2xl md:text-3xl tracking-tight text-on-background dark:text-[#dae2fd] uppercase">
            Today's Pick
          </h2>
          <div className="h-1 w-12 bg-primary dark:bg-[#adc6ff] mt-2 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredPosts.map((post) => (
          <Link
            key={post.id || post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-[2rem] overflow-hidden bg-white dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] hover:shadow-2xl hover:shadow-primary/5 dark:hover:shadow-[#adc6ff]/5 transition-all duration-500"
          >
            {/* Post Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              {post.image ? (
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/20">image</span>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              {post.category && (
                <span className="text-xs font-black uppercase tracking-[0.15em] text-primary dark:text-[#adc6ff] mb-4">
                  {post.category}
                </span>
              )}

              <h3 className="font-[family-name:var(--font-headline)] font-bold text-xl md:text-2xl leading-tight text-on-background dark:text-[#dae2fd] mb-4 group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="text-sm md:text-base text-on-surface-variant dark:text-[#c2c6d6] line-clamp-3 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-auto pt-6 border-t border-outline-variant/10 dark:border-[#424754] flex items-center gap-2 text-on-surface-variant dark:text-[#8c909f]">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-xs font-bold uppercase tracking-widest">
                  {post.readTime || "5 min read"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
