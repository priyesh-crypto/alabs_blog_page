"use client";

/**
 * Sidebar recommended-course card with gradient background.
 *
 * @param {{ course: { title: string, duration?: string, rating?: number, ctaUrl?: string, ctaLabel?: string, cta_url?: string, cta_label?: string } }} props
 * `ctaUrl`   — when provided, the button becomes a real anchor tag.
 * `ctaLabel` — button label (defaults to "Enroll Now →").
 */
export default function SidebarCourseCard({ course = {} }) {
  if (!course && process.env.NODE_ENV === 'development') {
    console.warn("SidebarCourseCard received null course prop");
  }


  const stars      = course.rating ? Math.round(course.rating) : 4;
  const starDisplay = "★".repeat(stars) + "☆".repeat(5 - stars);
  const ctaUrl     = course.ctaUrl  || course.cta_url   || null;
  const ctaLabel   = course.ctaLabel || course.cta_label || "Enroll Now →";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
    >
      <div className="p-5">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ background: "rgba(255,255,255,0.15)", color: "#b3d0ff" }}
        >
          Recommended Course
        </span>
        <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-white mb-2">
          {course.title}
        </h3>
        <p className="text-blue-200 text-xs mb-3">
          Based on your reading{course.duration ? ` · ${course.duration}` : ""}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "#fbbf24", letterSpacing: "1px" }}>{starDisplay}</span>
          {course.rating && <span className="text-xs text-blue-200">{course.rating}</span>}
        </div>
        {ctaUrl ? (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn block w-full py-2.5 rounded-xl font-bold text-sm text-center"
          >
            {ctaLabel}
          </a>
        ) : (
          <button className="glass-btn w-full py-2.5 rounded-xl font-bold text-sm">
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
