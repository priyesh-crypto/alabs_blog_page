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
  const position     = author.position;
  const expertise    = Array.isArray(author.expertise) ? author.expertise : [];
  const articleCount = author.articleCount || propArticleCount;
  const initials     = author.initials || name.split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2);

  const yearsExpDisplay = experience ? `${String(experience).replace(" Years", "")} yrs exp` : null;

  return (
    <div className="rounded-xl border border-white/10 p-3 bg-white/5 backdrop-blur-lg shadow-2xl h-fit min-h-0" suppressHydrationWarning>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-slate-200 uppercase tracking-wider text-[9px] font-bold mb-2">
        Author Spotlight
      </span>

      <div className="flex items-start gap-2 mb-2">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="w-9 h-9 rounded-full object-cover shrink-0 grayscale-[0.2] contrast-[1.1] ring-1 ring-white/20 mt-0.5"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center text-slate-200 font-bold text-sm shrink-0 ring-1 ring-white/20 mt-0.5">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/author/${author.slug}`}
            className="font-bold text-[13px] text-white hover:text-blue-300 transition-colors block leading-tight"
          >
            {name}
          </Link>
          {position && (
            <p className="text-[10px] font-medium text-blue-200 uppercase tracking-widest mt-0.5 mb-1">
              {position}
            </p>
          )}
          {bio && (
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-0.5">
              {bio}
            </p>
          )}
          {expertise.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {expertise.slice(0, 3).map((skill, i) => (
                <span key={i} className="px-1.5 py-[1px] rounded text-[8px] font-bold bg-white/10 text-slate-300 uppercase tracking-wider whitespace-nowrap">
                  {skill}
                </span>
              ))}
              {expertise.length > 3 && (
                <span className="px-1.5 py-[1px] rounded text-[8px] font-bold bg-white/5 text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  +{expertise.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-300 pt-2 border-t border-white/10">
        <span>
          <strong className="text-white font-bold">{articleCount}</strong> article{articleCount !== 1 ? "s" : ""}
        </span>
        {yearsExpDisplay && (
          <span>
            <strong className="text-white font-bold">{yearsExpDisplay}</strong>
          </span>
        )}
      </div>

      {author.linkedin && (
        <a
          href={author.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline group"
        >
          <svg className="w-3 h-3 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          Connect on LinkedIn
        </a>
      )}
    </div>
  );
}
