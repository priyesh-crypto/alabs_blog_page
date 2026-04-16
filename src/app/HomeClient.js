"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import HeroBanner from "@/components/HeroBanner";
import FilterBar from "@/components/FilterBar";
import ZoneRenderer from "@/components/ZoneRenderer";
import { useToast } from "@/components/Toast";
import NewsletterBanner from "@/components/NewsletterBanner";
import DiscussionSection from "@/components/DiscussionSection";
import CoursesGrid from "@/components/CoursesGrid";
import { FEATURED_AUTHOR_SLUG } from "@/lib/config";
import { authors } from "@/lib/data";

// Alias components as requested
const NewsletterDigest = NewsletterBanner;
const CommentsSection = DiscussionSection;
const RelatedCourses = CoursesGrid;

export default function HomeClient({ initialPosts, homepageWidgets }) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const addToast     = useToast();

  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicsOpen, setTopicsOpen]   = useState(false);
  const [skillsOpen, setSkillsOpen]   = useState(false);
  const [bookmarked, setBookmarked]   = useState(new Set());
  const [mounted, setMounted]         = useState(false);
  
  // Sync state with URL params after mount to prevent hydration mismatch
  useEffect(() => {
    setActiveTopic(searchParams.get("topic") || null);
    setActiveSkill(searchParams.get("skill") || "All");
    setSearchQuery(searchParams.get("q") || "");
    setMounted(true);
  }, [searchParams]);

  const allPosts = initialPosts || [];
  const authorPostCount = allPosts.filter((p) => p.authorId === FEATURED_AUTHOR_SLUG).length;
  const spotlight       = authors[FEATURED_AUTHOR_SLUG];

  // Fade-in observer
  useEffect(() => {
    if (!mounted) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in-section").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [allPosts, searchQuery, activeTopic, activeSkill, mounted]);

  const createQueryString = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "All") params.set(name, value);
    else params.delete(name);
    return params.toString();
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    router.push(`${pathname}?${createQueryString("q", val)}`, { scroll: false });
  };

  const handleTopicSelect = (tag) => {
    const next = activeTopic === tag ? null : tag;
    setActiveTopic(next);
    setTopicsOpen(false);
    router.push(`${pathname}?${createQueryString("topic", next)}`, { scroll: false });
  };

  const handleSkillSelect = (skill) => {
    const next = activeSkill === skill ? "All" : skill;
    setActiveSkill(next);
    setSkillsOpen(false);
    router.push(`${pathname}?${createQueryString("skill", next)}`, { scroll: false });
  };

  const heroPost  = allPosts[0];
  const filtered  = allPosts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || (p.domain_tags || []).some((t) => t.toLowerCase().includes(q));
    const matchTopic  = !activeTopic || activeTopic === "Hot Topic" || (p.domain_tags || []).includes(activeTopic) || p.category === activeTopic;
    const matchSkill  = activeSkill === "All" || p.skill_level === activeSkill;
    return matchSearch && matchTopic && matchSkill;
  });
  
  const gridPosts = heroPost && filtered.length > 1
    ? filtered.filter((p) => p.id !== heroPost.id)
    : filtered;

  const recommended = heroPost
    ? allPosts
        .filter((p) => p.id !== heroPost.id)
        .map((p) => ({ ...p, _s: (p.domain_tags || []).filter((t) => (heroPost.domain_tags || []).includes(t)).length }))
        .sort((a, b) => b._s - a._s)
        .slice(0, 4)
    : allPosts.slice(1, 5);

  const toggleBookmark = (slug) => {
    const next = new Set(bookmarked);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
      addToast("Article saved for later!", "success");
    }
    setBookmarked(next);
  };

  const handleShare = (slug) => {
    navigator.clipboard?.writeText(window.location.origin + `/blog/${slug}`);
    addToast("Link copied!", "success");
  };

  // Skip redundant widgets if they are already hardcoded below
  const hardcodedInLeftColumn = ['newsletter_section', 'discussion_section'];
  const hardcodedInBottom = ['courses_grid'];

  // Split widgets into main and sidebar
  let mainWidgets = homepageWidgets.filter(w => 
    !['ask_ai', 'course_card', 'recommended_posts', 'author_spotlight', 'salary_table'].includes(w.type) &&
    !hardcodedInLeftColumn.includes(w.type) &&
    !hardcodedInBottom.includes(w.type)
  );
  
  // FINAL CLIENT-SIDE SAFETY NET:
  // If main content is empty, but we have posts to show, inject the grid!
  if (mainWidgets.length === 0 && gridPosts.length > 0) {
    mainWidgets = [{ id: 'client-safety-posts', type: 'posts_grid', enabled: true, config: { title: 'Recently Published' } }];
  }

  const sidebarWidgets = homepageWidgets.filter(w => ['ask_ai', 'course_card', 'recommended_posts', 'author_spotlight', 'salary_table'].includes(w.type));

  const context = {
    posts: gridPosts,
    recommended,
    author: spotlight,
    authorPostCount,
    bookmarked,
    onToggleBookmark: toggleBookmark,
    onShare: handleShare
  };

  if (process.env.NODE_ENV === 'development') {
    console.log("[HomeClient] All homepageWidgets types:", homepageWidgets.map(w => `${w.type} (${w.enabled ? 'enabled' : 'disabled'})`));
    console.log("[HomeClient] Final mainWidgets types:", mainWidgets.map(w => w.type));
    console.log("[HomeClient] Widgets summary:", { mainCount: mainWidgets.length, sidebarCount: sidebarWidgets.length });
    console.log("[HomeClient] Posts check:", { gridPostsCount: gridPosts.length, heroPostId: heroPost?.id });
  }


  return (
    <>
      <Navbar activeCategory="Data Science" />

      <HeroBanner
        post={heroPost}
        bookmarked={bookmarked.has(heroPost?.slug)}
        onToggleBookmark={toggleBookmark}
      />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <FilterBar
          searchQuery={searchQuery}
          onSearch={handleSearch}
          activeTopic={activeTopic}
          onTopicSelect={handleTopicSelect}
          activeSkill={activeSkill}
          onSkillSelect={handleSkillSelect}
          onClearAll={() => { setActiveTopic(null); setActiveSkill("All"); setSearchQuery(""); router.push(pathname); }}
          topicsOpen={topicsOpen}
          onToggleTopics={() => { setTopicsOpen((o) => !o); setSkillsOpen(false); }}
          skillsOpen={skillsOpen}
          onToggleSkills={() => { setSkillsOpen((o) => !o); setTopicsOpen(false); }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-10">
            <ZoneRenderer widgets={mainWidgets} context={context} />
            
            {/* Hardcoded Left Column Blocks */}
            <NewsletterDigest />
            <CommentsSection postSlug="homepage" title="Community Discussion" />
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-5">
            <ZoneRenderer widgets={sidebarWidgets} context={context} />
          </aside>
        </div>
      </main>

      {/* Hardcoded Bottom Section (Full Width) */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <RelatedCourses showViewAll={true} />
      </div>

      {/* Footer widgets or specific sections can also be zones */}
      <Footer />
      <MobileBottomNav activePage="home" />
    </>
  );
}
