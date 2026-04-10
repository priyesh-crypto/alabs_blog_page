"use client";

import Link from "next/link";

/**
 * Author spotlight sidebar card.
 *
 * @param {{ author: object, articleCount?: number }} props
 */
export default function SidebarAuthorSpotlight({ author, articleCount = 0 }) {
  if (!author) return null;

  const yearsExp = author.experience?.replace(" Years", "") || "—";

  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
        style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)", color: "#fff" }}
      >
        Author Spotlight
      </span>
      <div className="flex items-center gap-3 mb-3">
        {author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.image}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center text-on-surface-variant dark:text-[#c2c6d6] font-bold text-base shrink-0">
            {author.initials}
          </div>
        )}
        <div className="min-w-0">
          <Link
            href={`/author/${author.slug}`}
            className="font-bold text-[14px] text-on-background dark:text-[#dae2fd] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
          >
            {author.name}
          </Link>
          <p className="text-[12px] text-on-surface-variant dark:text-[#8c909f] leading-snug line-clamp-2 mt-0.5">
            {author.bio}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5 text-[12px] text-on-surface-variant dark:text-[#8c909f] pt-3 border-t border-outline-variant/10 dark:border-[#424754]/40">
        <span>
          <strong className="text-on-background dark:text-[#dae2fd] font-bold">{articleCount}</strong> articles
        </span>
        <span>
          <strong className="text-on-background dark:text-[#dae2fd] font-bold">{yearsExp}</strong> yrs exp
        </span>
      </div>
    </div>
  );
}
