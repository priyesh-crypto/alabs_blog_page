"use client";

import React from "react";
import AskAI from "./AskAI";
import PostCard from "./PostCard";
import SidebarCourseCard from "./SidebarCourseCard";
import SidebarSalaryWidget from "./SidebarSalaryWidget";
import SidebarAuthorSpotlight from "./SidebarAuthorSpotlight";
import RecommendedPosts from "./RecommendedPosts";
import NewsletterBanner from "./NewsletterBanner";
import DiscussionSection from "./DiscussionSection";
import CoursesGrid from "./CoursesGrid";
import { SUGGESTED_AI_QUERIES, AI_CONTEXT, NEWSLETTER } from "@/lib/config";
import { courses as staticCourses } from "@/lib/data";


/**
 * Dynamic Zone Renderer
 * Maps CMS widget types to React components.
 * 
 * @param {{ 
 *   widgets: Array,
 *   context?: {
 *     posts?: Array,
 *     recommended?: Array,
 *     author?: Object,
 *     authorPostCount?: number,
 *     bookmarked?: Set,
 *     onToggleBookmark?: Function,
 *     onShare?: Function
 *   }
 * }} props
 */
export default function ZoneRenderer({ widgets, context = {} }) {
  if (!widgets || !Array.isArray(widgets)) return null;

  return (
    <>
      {widgets.filter(w => w.enabled).map((widget) => {
        const cfg = widget.config || {};

        switch (widget.type) {
          case "ask_ai":
            return (
              <AskAI
                key={widget.id}
                questions={SUGGESTED_AI_QUERIES}
                context={AI_CONTEXT}
                placeholder={cfg.placeholder || "Ask anything about data science…"}
              />
            );

          case "posts_grid":
            return (
              <div key={widget.id} className="fade-in-section">
                <h2 className="font-[family-name:var(--font-headline)] font-bold text-lg dark:text-[#dae2fd] mb-6">
                  {cfg.title || "Recent Blog Posts"}
                </h2>
                {context.posts?.length === 0 ? (
                  <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm py-8 col-span-2">
                    No posts match your filters. Try a different search or tag.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {context.posts?.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        bookmarked={context.bookmarked?.has(post.slug)}
                        onToggleBookmark={context.onToggleBookmark}
                        onShare={context.onShare}
                      />
                    ))}
                  </div>
                )}
              </div>
            );

          case "newsletter_section":
            return (
              <section key={widget.id} className="py-14 bg-white dark:bg-[#0b1326]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8">
                    <div className="mb-10">
                      <NewsletterBanner />
                    </div>
                    <DiscussionSection title={NEWSLETTER.title} postSlug="homepage" />
                  </div>
                  <div className="hidden lg:block lg:col-span-4" />
                </div>
              </section>
            );

          case "courses_grid":
            return <CoursesGrid key={widget.id} />;

          case "course_card": {
            const course = {
              title:    cfg.fallback_title    || staticCourses?.[0]?.title,
              duration: cfg.fallback_duration || staticCourses?.[0]?.duration,
              rating:   cfg.fallback_rating   ?? staticCourses?.[0]?.rating,
              ctaUrl:   cfg.cta_url           || staticCourses?.[0]?.ctaUrl,
              ctaLabel: cfg.cta_label         || "Enroll Now →",
            };
            return <SidebarCourseCard key={widget.id} course={course} />;
          }

          case "recommended_posts":
            return <RecommendedPosts key={widget.id} posts={context.recommended || []} />;

          case "author_spotlight": {
            const authorData = cfg.author || context.author;
            console.log('Author Data Payload (Widget):', authorData);
            return (
              <SidebarAuthorSpotlight
                key={widget.id}
                author={authorData}
                articleCount={cfg.article_count || context.authorPostCount || 0}
              />
            );
          }

          case "salary_table":
            return <SidebarSalaryWidget key={widget.id} config={cfg} />;

          default:
            if (process.env.NODE_ENV === "development") {
              console.warn(`[ZoneRenderer] Unknown widget type: ${widget.type}`, widget);
            }
            return null;
        }
      })}
    </>
  );
}
