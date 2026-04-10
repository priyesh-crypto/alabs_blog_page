"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";
import { authors, courses } from "@/lib/data";
import { SUGGESTED_AI_QUERIES, AI_CONTEXT, FEATURED_AUTHOR_SLUG, NEWSLETTER } from "@/lib/config";
import AskAI from "@/components/AskAI";
import PostCard from "@/components/PostCard";
import HeroBanner from "@/components/HeroBanner";
import FilterBar from "@/components/FilterBar";
import SidebarCourseCard from "@/components/SidebarCourseCard";
import SidebarSalaryWidget from "@/components/SidebarSalaryWidget";
import SidebarAuthorSpotlight from "@/components/SidebarAuthorSpotlight";
import RecommendedPosts from "@/components/RecommendedPosts";
import NewsletterBanner from "@/components/NewsletterBanner";
import DiscussionSection from "@/components/DiscussionSection";
import CoursesGrid from "@/components/CoursesGrid";

function HomeContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();
  const addToast     = useToast();

  const [activeTopic, setActiveTopic] = useState(searchParams.get("topic") || null);
  const [activeSkill, setActiveSkill] = useState(searchParams.get("skill") || "All");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [topicsOpen, setTopicsOpen]   = useState(false);
  const [skillsOpen, setSkillsOpen]   = useState(false);
  const [allPosts, setAllPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [bookmarked, setBookmarked]   = useState(new Set());
  const [authorPostCount, setAuthorPostCount] = useState(0);

  // Fetch posts from Supabase via API
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        const posts = Array.isArray(data) ? data : [];
        setAllPosts(posts);
        // Calculate featured author post count dynamically
        setAuthorPostCount(
          posts.filter((p) => p.authorId === FEATURED_AUTHOR_SLUG).length
        );
        setPostsLoading(false);
      })
      .catch(() => setPostsLoading(false));
  }, []);

  // Fade-in observer — re-run after posts load so filled grid elements trigger .visible
  useEffect(() => {
    if (postsLoading) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in-section").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [postsLoading]);

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
  // If there's only 1 post, show it in the grid too so the page isn't empty
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

  const spotlight = authors[FEATURED_AUTHOR_SLUG];

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
    navigator.clipboard?.writeText(window.location.origin + `/article/${slug}`);
    addToast("Link copied!", "success");
  };

  if (postsLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0b1326]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">Loading content…</span>
      </div>
    </div>
  );

  return (
    <>
      <Navbar activeCategory="Data Science" />

      {/* ── Hero ── */}
      <HeroBanner
        post={heroPost}
        bookmarked={bookmarked.has(heroPost?.slug)}
        onToggleBookmark={toggleBookmark}
      />

      {/* ── Main Body ── */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Filter Bar */}
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

        {/* ── Posts + Sidebar Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Posts */}
          <div className="lg:col-span-8 fade-in-section">
            <h2 className="font-[family-name:var(--font-headline)] font-bold text-lg dark:text-[#dae2fd] mb-6">
              Recent Blog Posts
            </h2>
            {gridPosts.length === 0 ? (
              <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm py-8 col-span-2">
                No posts match your filters. Try a different search or tag.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {gridPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    bookmarked={bookmarked.has(post.slug)}
                    onToggleBookmark={toggleBookmark}
                    onShare={handleShare}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="lg:col-span-4 flex flex-col gap-5 fade-in-section">
            <AskAI
              questions={SUGGESTED_AI_QUERIES}
              context={AI_CONTEXT}
              placeholder="Ask anything about data science…"
            />
            <SidebarCourseCard course={courses[0]} />
            <RecommendedPosts posts={recommended} />
            <SidebarAuthorSpotlight author={spotlight} articleCount={authorPostCount} />
            <SidebarSalaryWidget />
          </aside>
        </div>
      </main>

      {/* ── Newsletter + Discussion ── */}
      <section className="py-14 bg-white dark:bg-[#0b1326]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="mb-10">
              <NewsletterBanner />
            </div>
            <DiscussionSection title={NEWSLETTER.title} postSlug="homepage" />
          </div>
          <div className="hidden lg:block lg:col-span-4" />
        </div>
      </section>

      <CoursesGrid />
      <Footer />
      <MobileBottomNav activePage="home" />
    </>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0b1326]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">Loading content…</span>
          </div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </ToastProvider>
  );
}
