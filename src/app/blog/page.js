"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";
import { courses } from "@/lib/data";
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
import Pagination from "@/components/Pagination";
import FeaturedSection from "@/components/FeaturedSection";
import PostCarousel from "@/components/PostCarousel";

const POSTS_PER_PAGE = 12;

function BlogListingContent() {
  const addToast = useToast();
  const [search, setSearch]           = useState("");
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSkill, setActiveSkill] = useState("All");
  const [topicsOpen, setTopicsOpen]   = useState(false);
  const [skillsOpen, setSkillsOpen]   = useState(false);
  const [allPosts, setAllPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [bookmarked, setBookmarked]   = useState(new Set());
  const [authorPostCount, setAuthorPostCount] = useState(0);
  const [spotlight, setSpotlight]     = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [blogConfig, setBlogConfig]   = useState({ featured_slugs: [], carousels: [] });

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, activeTopic, activeSkill]);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        const posts = Array.isArray(data) ? data : [];
        setAllPosts(posts);
        setAuthorPostCount(posts.filter((p) => p.authorId === FEATURED_AUTHOR_SLUG).length);
        setPostsLoading(false);
      })
      .catch(() => setPostsLoading(false));

    fetch("/api/authors")
      .then((r) => r.ok ? r.json() : [])
      .then((authors) => {
        const featured = authors.find((a) => a.slug === FEATURED_AUTHOR_SLUG) || authors[0] || null;
        setSpotlight(featured);
      })
      .catch(() => {});

    fetch("/api/site-config/blog-page")
      .then((r) => r.ok ? r.json() : { featured_slugs: [], carousels: [] })
      .then(setBlogConfig)
      .catch(() => {});
  }, []);

  // Resolve featured posts from config (preserve admin-chosen order)
  const featuredPosts = blogConfig.featured_slugs
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter(Boolean);

  // Build enabled carousels with their resolved posts
  const resolvedCarousels = (blogConfig.carousels || [])
    .filter((c) => c.enabled !== false)
    .map((c) => {
      let posts = [];
      if (c.source === "manual") {
        posts = (c.slugs || [])
          .map((slug) => allPosts.find((p) => p.slug === slug))
          .filter(Boolean);
      } else if (c.source === "category") {
        const cat = (c.category || "").toLowerCase();
        posts = allPosts.filter((p) =>
          (p.category || "").toLowerCase() === cat ||
          (p.domain_tags || []).some((t) => (t || "").toLowerCase() === cat)
        );
      } else {
        posts = allPosts;
      }
      return { ...c, posts: posts.slice(0, c.limit || 10) };
    })
    .filter((c) => c.posts.length > 0);

  // Set of slugs already shown above (featured + carousels) — to exclude from "Latest"
  const shownSlugs = new Set([
    ...featuredPosts.map((p) => p.slug),
    ...resolvedCarousels.flatMap((c) => c.posts.map((p) => p.slug)),
  ]);

  const isFilteringOrSearching = !!(search || activeTopic || activeSkill !== "All");
  const showCurated = !isFilteringOrSearching && (featuredPosts.length > 0 || resolvedCarousels.length > 0);

  // Hero uses first curated featured if set, else newest post
  const featuredPost = featuredPosts[0] || allPosts[0];

  const allFiltered = allPosts.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.domain_tags || []).some((t) => t.toLowerCase().includes(q));
    const matchTopic = !activeTopic || activeTopic === "Hot Topic" ||
      (p.domain_tags || []).includes(activeTopic) || p.category === activeTopic;
    const matchSkill = activeSkill === "All" || p.skill_level === activeSkill;
    return matchSearch && matchTopic && matchSkill;
  });

  // When not filtering, exclude posts already shown in curated sections (hero + featured + carousels)
  const isFiltering = search || activeTopic || activeSkill !== "All";
  const excludeFromLatest = new Set(
    isFiltering ? [] : [featuredPost?.id, ...[...shownSlugs].map((s) => allPosts.find((p) => p.slug === s)?.id)].filter(Boolean)
  );
  const filtered = !isFiltering && allFiltered.length > excludeFromLatest.size
    ? allFiltered.filter((p) => !excludeFromLatest.has(p.id))
    : allFiltered;

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * POSTS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to top of post grid
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

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
      <Navbar activeCategory="Blog" />

      {/* ── Hero ── */}
      <HeroBanner
        post={featuredPost}
        bookmarked={bookmarked.has(featuredPost?.slug)}
        onToggleBookmark={toggleBookmark}
      />

      {/* ── Curated Sections (Featured + Carousels) ── */}
      {showCurated && (
        <div className="max-w-7xl mx-auto px-6 pt-10">
          {/* Editor's Featured — only render if we have at least 2 (1 hero + 1 side) */}
          {featuredPosts.length >= 2 && (
            <FeaturedSection posts={featuredPosts} />
          )}
          {/* Super admin-configured carousels */}
          {resolvedCarousels.map((c) => (
            <PostCarousel
              key={c.id}
              title={c.title}
              posts={c.posts}
              ctaHref={c.source === "category" && c.category ? `/blog/category/${encodeURIComponent(c.category.toLowerCase().replace(/\s+/g, "-"))}` : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Main Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Filter Bar */}
        <FilterBar
          searchQuery={search}
          onSearch={setSearch}
          activeTopic={activeTopic}
          onTopicSelect={(t) => { setActiveTopic((prev) => prev === t ? null : t); setTopicsOpen(false); }}
          activeSkill={activeSkill}
          onSkillSelect={(s) => { setActiveSkill(s); setSkillsOpen(false); }}
          onClearAll={() => { setActiveTopic(null); setActiveSkill("All"); setSearch(""); }}
          topicsOpen={topicsOpen}
          onToggleTopics={() => { setTopicsOpen((o) => !o); setSkillsOpen(false); }}
          skillsOpen={skillsOpen}
          onToggleSkills={() => { setSkillsOpen((o) => !o); setTopicsOpen(false); }}
        />

        {/* Posts + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Posts Grid ── */}
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-[family-name:var(--font-headline)] font-bold text-xl md:text-2xl text-on-background dark:text-[#dae2fd]">
                  {isFiltering ? "Search Results" : "Latest Articles"}
                </h2>
                {!isFiltering && (
                  <p className="text-xs text-on-surface-variant dark:text-[#8c909f] mt-0.5">
                    Fresh insights, ordered by newest first
                  </p>
                )}
              </div>
              {filtered.length > 0 && (
                <span className="text-xs text-on-surface-variant dark:text-[#8c909f]">
                  Showing {startIdx + 1}–{Math.min(startIdx + POSTS_PER_PAGE, filtered.length)} of {filtered.length}
                </span>
              )}
            </div>
            {filtered.length === 0 ? (
              <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm py-8">No posts match your filters.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {paginated.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      bookmarked={bookmarked.has(post.slug)}
                      onToggleBookmark={toggleBookmark}
                      onShare={handleShare}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  className="mt-10"
                />
              </>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="lg:col-span-4 flex flex-col gap-5">
            <AskAI
              questions={SUGGESTED_AI_QUERIES}
              context={AI_CONTEXT}
              placeholder="Ask anything about data science…"
            />
            <SidebarCourseCard course={courses[0]} />
            <RecommendedPosts posts={allPosts.slice(1, 5)} />
            <SidebarAuthorSpotlight author={spotlight} articleCount={authorPostCount} />
            <SidebarSalaryWidget />
          </aside>
        </div>
      </div>

      {/* ── Newsletter + Discussion ── */}
      <section className="py-14 bg-white dark:bg-[#0b1326]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="mb-10">
              <NewsletterBanner />
            </div>
            <DiscussionSection title={NEWSLETTER.title} postSlug="blog-listing" />
          </div>
          <div className="hidden lg:block lg:col-span-4" />
        </div>
      </section>

      <CoursesGrid />
      <Footer />
      <MobileBottomNav activePage="insights" />
    </>
  );
}

export default function BlogPage() {
  return (
    <ToastProvider>
      <BlogListingContent />
    </ToastProvider>
  );
}
