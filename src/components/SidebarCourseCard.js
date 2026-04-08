"use client";

/**
 * Sidebar recommended-course card with gradient background.
 * Accepts a `course` object instead of hardcoded strings.
 *
 * @param {{ course: { title: string, duration?: string, rating?: number } }} props
 */
export default function SidebarCourseCard({ course }) {
  if (!course) return null;

  const stars = course.rating ? Math.round(course.rating) : 4;
  const starDisplay = "★".repeat(stars) + "☆".repeat(5 - stars);

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
        <button className="glass-btn w-full py-2.5 rounded-xl font-bold text-sm">
          Enroll Now →
        </button>
      </div>
    </div>
  );
}
