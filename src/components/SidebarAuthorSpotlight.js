"use client";

import Link from "next/link";

/**
 * Author spotlight sidebar card.
 *
 * @param {{ author: object, articleCount?: number }} props
 */
export default function SidebarAuthorSpotlight({ author, articleCount: propArticleCount = 0 }) {
  if (!author || Object.keys(author).length === 0) return null;

  const name         = author.name;
  if (!name) return null; // Name is the minimum required field

  const bio          = author.bio || "";
  const avatarUrl    = author.avatarUrl || author.image;
  const experience   = author.experience;
  const articleCount = author.articleCount || propArticleCount;
  const initials     = author.initials || name.split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2);

  const yearsExpDisplay = experience ? `${String(experience).replace(" Years", "")} yrs exp` : null;

  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm h-fit min-h-0">
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)", color: "#fff" }}
      >
        Author Spotlight
      </span>

      <div className="flex items-center gap-3 mb-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="w-11 h-11 rounded-full object-cover shrink-0 grayscale-[0.2] contrast-[1.1]"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center text-on-surface-variant dark:text-[#c2c6d6] font-bold text-base shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/author/${author.slug}`}
            className="font-bold text-[14px] text-on-background dark:text-[#dae2fd] hover:text-primary dark:hover:text-[#adc6ff] transition-colors block leading-tight"
          >
            {name}
          </Link>
          {bio && (
            <p className="text-[12px] text-on-surface-variant dark:text-[#8c909f] leading-snug line-clamp-2 mt-0.5">
              {bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-on-surface-variant dark:text-[#8c909f] pt-3 border-t border-outline-variant/10 dark:border-[#424754]/40">
        <span>
          <strong className="text-on-background dark:text-[#dae2fd] font-bold">{articleCount}</strong> article{articleCount !== 1 ? "s" : ""}
        </span>
        {yearsExpDisplay && (
          <span>
            <strong className="text-on-background dark:text-[#dae2fd] font-bold">{yearsExpDisplay}</strong>
          </span>
        )}
      </div>

      {author.linkedin && (
        <a
          href={author.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/10 dark:border-[#424754]/40 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline group"
        >
          <svg className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          Connect on LinkedIn
        </a>
      )}
    </div>
  );
}
