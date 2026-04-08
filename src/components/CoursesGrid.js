"use client";

import Image from "next/image";
import Link from "next/link";
import { courses } from "@/lib/data";

/**
 * "Related Courses" grid section — reused on homepage, blog listing, and article pages.
 *
 * @param {{ limit?: number, showViewAll?: boolean }} props
 */
export default function CoursesGrid({ limit = 3, showViewAll = true }) {
  const displayedCourses = courses.slice(0, limit);

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
            <Link
              href="#"
              className="flex items-center gap-1 text-sm font-bold text-primary dark:text-[#adc6ff] hover:opacity-80 transition-opacity"
            >
              View All Courses{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col rounded-2xl overflow-hidden border bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754] group hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden relative bg-surface-container-high dark:bg-[#131b2e]">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="33vw"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-[#adc6ff] mb-2">
                  {course.label}
                </span>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-base dark:text-[#dae2fd] mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] mb-4 flex-1 line-clamp-2">
                  {course.desc}
                </p>
                <a
                  href="#"
                  className="glass-chip active block w-full text-center py-2.5 rounded-xl font-bold text-sm"
                >
                  View Courses
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
