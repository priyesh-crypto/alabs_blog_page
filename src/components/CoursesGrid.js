"use client";

import { useState, useEffect } from "react";

/**
 * "Related Courses" grid section — fetches from /api/courses (Supabase-backed).
 *
 * @param {{ limit?: number, showViewAll?: boolean }} props
 */
export default function CoursesGrid({ limit = 3, showViewAll = true }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const displayed = courses.slice(0, limit);

  if (displayed.length === 0) return null;

  return (
    <section
      className="py-16 border-t bg-surface-container-low dark:bg-[#131b2e] border-outline-variant/10 dark:border-[#424754] fade-in-section"
      id="courses"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-[family-name:var(--font-headline)] font-bold text-2xl dark:text-[#dae2fd]">
            Related Courses
          </h2>
          {showViewAll && (
            <a
              href="https://www.analytixlabs.co.in/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-bold text-primary dark:text-[#adc6ff] hover:opacity-80 transition-opacity"
            >
              View All Courses{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayed.map((course) => (
            <div
              key={course.id}
              className="flex flex-col rounded-2xl overflow-hidden border bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754] group hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden relative bg-surface-container-high dark:bg-[#131b2e]">
                {course.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <span className="material-symbols-outlined text-4xl text-primary/40">school</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-[#adc6ff] mb-2">
                  {course.label}
                </span>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-base dark:text-[#dae2fd] mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] mb-4 flex-1 line-clamp-2">
                  {course.description}
                </p>
                <a
                  href={course.url || "#"}
                  target={course.url && course.url !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="glass-chip active block w-full text-center py-2.5 rounded-xl font-bold text-sm"
                >
                  View Course
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
