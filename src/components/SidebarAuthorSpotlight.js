"use client";

import Link from "next/link";

/**
 * Author spotlight sidebar card.
 *
 * @param {object} props
 * @param {object} props.author
 * @param {number} [props.articleCount]
 * @param {"light"|"dark"} [props.variant] - "light" (default) or "dark" (gradient sidebar)
 * @param {boolean} [props.compact] - if true, renders a one-row compact card linking to the profile
 */
export default function SidebarAuthorSpotlight({
  author,
  articleCount: propArticleCount = 0,
  variant = "light",
  compact = false,
}) {
  if (!author || Object.keys(author).length === 0) return null;
  const name = author.name;
  if (!name) return null;

  const bio          = author.bio || "";
  const avatarUrl    = author.avatarUrl || author.image;
  const experience   = author.experience;
  const position     = author.position;
  const expertise    = Array.isArray(author.expertise) ? author.expertise : [];
  const articleCount = author.articleCount || propArticleCount;
  const initials     = author.initials || name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2);
  const yearsExpDisplay = experience ? `${String(experience).replace(" Years", "")} yrs exp` : null;

  const isDark = variant === "dark";

  // ───────── Compact variant ─────────
  if (compact) {
    const c = isDark
      ? {
          card: "block rounded-lg border border-white/10 p-3 bg-transparent hover:bg-white/5 transition-colors group",
          label: "text-blue-200/70",
          avatarRing: "ring-white/20",
          avatarBg: "bg-gradient-to-br from-slate-700 to-blue-900 text-slate-100",
          avatarImg: "bg-white/90",
          name: "text-white group-hover:text-blue-300",
          meta: "text-slate-300",
          chevron: "text-blue-200/60 group-hover:text-white group-hover:translate-x-0.5",
        }
      : {
          card: "block rounded-xl border border-outline-variant/30 dark:border-[#424754] p-3 bg-white dark:bg-[#131b2e] shadow-sm hover:shadow-md hover:border-primary/40 dark:hover:border-[#adc6ff]/40 transition-all group",
          label: "text-primary dark:text-[#adc6ff]",
          avatarRing: "ring-primary/20 dark:ring-[#adc6ff]/20",
          avatarBg: "bg-gradient-to-br from-primary to-primary-container dark:from-[#003b93] dark:to-[#0051c3] text-white",
          avatarImg: "bg-white dark:bg-[#0b1326]",
          name: "text-on-background dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff]",
          meta: "text-on-surface-variant dark:text-[#8c909f]",
          chevron: "text-on-surface-variant/60 dark:text-[#8c909f] group-hover:text-primary dark:group-hover:text-[#adc6ff] group-hover:translate-x-0.5",
        };

    return (
      <Link href={`/author/${author.slug}`} className={c.card} suppressHydrationWarning>
        <span className={`block text-[9px] tracking-[0.2em] ${c.label} uppercase font-bold mb-2`}>
          Author Spotlight
        </span>
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className={`w-10 h-10 rounded-full object-contain p-0.5 shrink-0 ring-2 ${c.avatarRing} ${c.avatarImg}`}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${c.avatarBg} flex items-center justify-center font-bold text-xs shrink-0 ring-2 ${c.avatarRing}`}>
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={`font-bold text-[13px] ${c.name} leading-tight truncate transition-colors`}>
              {name}
            </p>
            <p className={`text-[11px] ${c.meta} truncate`}>
              <span className="font-semibold">{articleCount}</span> article{articleCount !== 1 ? "s" : ""}
              {position && <> · {position}</>}
            </p>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`shrink-0 ${c.chevron} transition-transform`}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </Link>
    );
  }

  // ───────── Full variant ─────────
  const s = isDark
    ? {
        card: "rounded-lg border border-white/10 p-4 bg-transparent",
        label: "text-blue-200/80",
        avatarRing: "ring-white/20",
        avatarBg: "bg-gradient-to-br from-slate-700 to-blue-900 text-slate-100",
        avatarImg: "bg-white/90",
        name: "text-white hover:text-blue-300",
        position: "text-blue-200",
        bio: "text-slate-300",
        pill: "bg-white/10 text-slate-200",
        pillMore: "bg-white/5 text-slate-400",
        divider: "border-white/10",
        meta: "text-slate-300",
        metaStrong: "text-white",
        linkedin: "text-blue-300 hover:text-blue-200",
      }
    : {
        card: "rounded-2xl border border-outline-variant/30 dark:border-[#424754] p-5 bg-white dark:bg-[#131b2e] shadow-sm",
        label: "text-primary dark:text-[#adc6ff]",
        avatarRing: "ring-primary/20 dark:ring-[#adc6ff]/20",
        avatarBg: "bg-gradient-to-br from-primary to-primary-container dark:from-[#003b93] dark:to-[#0051c3] text-white",
        avatarImg: "bg-white dark:bg-[#0b1326]",
        name: "text-on-background dark:text-[#dae2fd] hover:text-primary dark:hover:text-[#adc6ff]",
        position: "text-primary dark:text-[#adc6ff]",
        bio: "text-on-surface-variant dark:text-[#c2c6d6]",
        pill: "bg-primary/8 dark:bg-[#adc6ff]/10 text-primary dark:text-[#adc6ff]",
        pillMore: "bg-surface-container dark:bg-[#222a3d] text-on-surface-variant dark:text-[#c2c6d6]",
        divider: "border-outline-variant/20 dark:border-[#424754]",
        meta: "text-on-surface-variant dark:text-[#8c909f]",
        metaStrong: "text-on-background dark:text-[#dae2fd]",
        linkedin: "text-primary dark:text-[#adc6ff] hover:opacity-80",
      };

  return (
    <div className={s.card} suppressHydrationWarning>
      <span className={`block text-[10px] tracking-[0.2em] ${s.label} uppercase font-bold mb-3`}>
        Author Spotlight
      </span>

      <div className="flex items-start gap-3 mb-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className={`w-12 h-12 rounded-full object-contain p-1 shrink-0 ring-2 ${s.avatarRing} ${s.avatarImg}`}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className={`w-12 h-12 rounded-full ${s.avatarBg} flex items-center justify-center font-bold text-sm shrink-0 ring-2 ${s.avatarRing}`}>
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/author/${author.slug}`}
            className={`font-bold text-sm ${s.name} transition-colors block leading-tight`}
          >
            {name}
          </Link>
          {position && (
            <p className={`text-[10px] font-semibold ${s.position} uppercase tracking-wider mt-0.5`}>
              {position}
            </p>
          )}
        </div>
      </div>

      {bio && (
        <p className={`text-[13px] ${s.bio} leading-relaxed line-clamp-3 mb-3`}>
          {bio}
        </p>
      )}

      {expertise.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {expertise.slice(0, 3).map((skill, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.pill} whitespace-nowrap`}>
              {skill}
            </span>
          ))}
          {expertise.length > 3 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.pillMore} whitespace-nowrap`}>
              +{expertise.length - 3}
            </span>
          )}
        </div>
      )}

      <div className={`flex items-center gap-3 text-[11px] ${s.meta} pt-3 border-t ${s.divider}`}>
        <span>
          <strong className={`${s.metaStrong} font-bold`}>{articleCount}</strong> article{articleCount !== 1 ? "s" : ""}
        </span>
        {yearsExpDisplay && (
          <>
            <span className="opacity-30">·</span>
            <span className={`${s.metaStrong} font-bold`}>{yearsExpDisplay}</span>
          </>
        )}
        {author.linkedin && (
          <a
            href={author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-auto ${s.linkedin} transition-transform hover:scale-110`}
            aria-label="LinkedIn Profile"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
