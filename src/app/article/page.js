"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";
import { courses, authors } from "@/lib/data";
import AskAI from "@/components/AskAI";

const FILTER_CHIPS = ["Hot Topic", "Data Science", "Deep Learning", "Business Analyst", "Cyber Security"];
const SKILL_LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];
const TOPIC_OPTIONS = ["Data Science", "Machine Learning", "Deep Learning", "AI Engineering", "Analytics", "Career Growth"];

const SALARY_ROWS = [
  { role: "Data Scientist", range: "₹18–28 LPA", meta: "Bangalore · 3-5 yrs", badge: null },
  { role: "ML Engineer",    range: "₹18–28 LPA", meta: "Mumbai · 2-4 yrs",    badge: null },
  { role: "Data Analyst",   range: "₹10–20 LPA", meta: "Delhi NCR · 0-3 yrs", badge: null },
  { role: "AI Researcher",  range: "₹18–28 LPA", meta: "Pan India · 6+ yrs",  badge: "New" },
];

function BlogListingContent() {
  const addToast = useToast();
  const [search, setSearch]           = useState("");
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSkill, setActiveSkill] = useState("All");
  const [topicsOpen, setTopicsOpen]   = useState(false);
  const [skillsOpen, setSkillsOpen]   = useState(false);
  const [allPosts, setAllPosts]         = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [bookmarked, setBookmarked]     = useState(new Set());
  const [emailInput, setEmailInput]     = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "Ravi S.",  time: "2 days ago", text: "Great breakdown! Can you cover Weaviate vs Pinecone comparison in the next article?" },
    { id: 2, user: "Priya M.", time: "4 days ago", text: "The HNSW section was super clarifying. Bookmarked this for my team." },
  ]);

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => { setAllPosts(Array.isArray(data) ? data : []); setPostsLoading(false); })
      .catch(() => setPostsLoading(false));
  }, []);

  const featuredPost = allPosts[0];

  const filtered = allPosts.slice(1).filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.domain_tags || []).some(t => t.toLowerCase().includes(q));
    const matchTopic = !activeTopic || activeTopic === "Hot Topic" ||
      (p.domain_tags || []).includes(activeTopic) || p.category === activeTopic;
    const matchSkill = activeSkill === "All" || p.skill_level === activeSkill;
    return matchSearch && matchTopic && matchSkill;
  });

  const spotlight = authors["aris-thorne"];

  const suggestedQueries = [
    "I'm a beginner, where to start?",
    "Best Python libraries for data science?",
    "How to build a machine learning portfolio?",
    "SQL vs Python for data analysis?",
    "Generative AI career roadmap 2026",
  ];

  const toggleBookmark = (slug) => {
    const next = new Set(bookmarked);
    if (next.has(slug)) { next.delete(slug); }
    else { next.add(slug); addToast("Article saved for later!", "success"); }
    setBookmarked(next);
  };

  const postComment = () => {
    if (!commentInput.trim()) return;
    setComments(c => [{ id: Date.now(), user: "You", time: "Just now", text: commentInput }, ...c]);
    setCommentInput("");
    addToast("Comment posted!", "success");
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

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-24 pb-16"
        style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <span className="glass-badge inline-block mb-5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
              Featured Analysis
            </span>
            <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-white leading-tight mb-6">
              {featuredPost?.title || "Language Models: Architecting the Future of Enterprise Intelligence"}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mb-8 text-blue-200 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {featuredPost?.readTime || "12 min read"}
              </span>
              {featuredPost?.domain_tags?.[0] && (
                <span className="glass-badge px-2.5 py-1 rounded-full text-xs font-medium">
                  {featuredPost.domain_tags[0]}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Updated {featuredPost?.updatedAt || "Mar 2026"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/article/${featuredPost?.slug || ""}`}
                className="glass-btn px-6 py-3 rounded-full font-bold text-sm">
                Read More
              </Link>
              <button
                onClick={() => toggleBookmark(featuredPost?.slug)}
                className="glass-btn px-6 py-3 rounded-full font-bold text-sm">
                {bookmarked.has(featuredPost?.slug) ? "Saved ✓" : "Save Article"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Body ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Search + Dropdowns */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="relative flex-1 min-w-56">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input type="text" placeholder="Search insights using semantic queries..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl outline-none bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary" />
          </div>

          {/* Topics dropdown */}
          <div className="relative">
            <button onClick={() => { setTopicsOpen(o => !o); setSkillsOpen(false); }}
              className="glass-dropdown flex items-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold">
              Topics <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {topicsOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 rounded-xl shadow-xl z-30 overflow-hidden border bg-surface-container-lowest dark:bg-[#171f33] border-outline-variant/20 dark:border-[#424754]">
                {TOPIC_OPTIONS.map(t => (
                  <button key={t}
                    onClick={() => { setActiveTopic(prev => prev === t ? null : t); setTopicsOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd] ${activeTopic === t ? "text-primary dark:text-[#adc6ff] font-bold" : ""}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skill Level dropdown */}
          <div className="relative">
            <button onClick={() => { setSkillsOpen(o => !o); setTopicsOpen(false); }}
              className="glass-dropdown flex items-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold">
              Skill Level <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {skillsOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 rounded-xl shadow-xl z-30 overflow-hidden border bg-surface-container-lowest dark:bg-[#171f33] border-outline-variant/20 dark:border-[#424754]">
                {SKILL_LEVELS.map(s => (
                  <button key={s}
                    onClick={() => { setActiveSkill(s); setSkillsOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd] ${activeSkill === s ? "text-primary dark:text-[#adc6ff] font-bold" : ""}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_CHIPS.map(chip => (
            <button key={chip}
              onClick={() => setActiveTopic(prev => prev === chip ? null : chip)}
              className={`glass-chip px-4 py-1.5 rounded-full text-sm font-semibold ${activeTopic === chip ? "active" : ""}`}>
              {chip}
            </button>
          ))}
        </div>

        {/* Posts + Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Posts Grid ── */}
          <div className="lg:col-span-8">
            <h2 className="font-[family-name:var(--font-headline)] font-bold text-lg dark:text-[#dae2fd] mb-6">
              Recent Blog Posts
            </h2>
            {filtered.length === 0 ? (
              <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm py-8">No posts match your filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map(post => (
                  <article key={post.id}
                    className="flex flex-col rounded-2xl overflow-hidden border bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754] hover:shadow-lg transition-shadow group">
                    <div className="aspect-video relative bg-surface-container-high dark:bg-[#131b2e] overflow-hidden">
                      {post.image ? (
                        <Image src={post.image} alt={post.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width:640px) 100vw, 33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline/20">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-primary dark:text-[#adc6ff] font-[family-name:var(--font-label)] tracking-wide">{post.category}</span>
                        <span className="text-[11px] text-on-surface-variant dark:text-[#8c909f] font-[family-name:var(--font-label)]">{post.readTime}</span>
                      </div>
                      <h3 className="font-[family-name:var(--font-headline)] font-bold text-[15px] leading-snug text-on-surface dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors">
                        <Link href={`/article/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex items-center justify-between pt-3 mt-auto border-t border-outline-variant/10 dark:border-[#424754]">
                        <div className="flex items-center gap-2">
                          {post.author?.image ? (
                            <Image src={post.author.image} alt={post.author.name || ""} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[8px]">{post.author?.initials || "?"}</div>
                          )}
                          <span className="text-xs text-on-surface-variant dark:text-[#c2c6d6]">{post.author?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleBookmark(post.slug)}
                            className="text-outline hover:text-primary dark:text-[#8c909f] dark:hover:text-[#adc6ff] transition-colors">
                            <span className="material-symbols-outlined text-[18px]"
                              style={{ fontVariationSettings: bookmarked.has(post.slug) ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                          </button>
                          <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + `/article/${post.slug}`); addToast("Link copied!", "success"); }}
                            className="text-outline hover:text-primary dark:text-[#8c909f] dark:hover:text-[#adc6ff] transition-colors">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="lg:col-span-4 flex flex-col gap-5">

            {/* Ask the AI */}
            <AskAI
              questions={suggestedQueries}
              context="AnalytixLabs blog covering Data Science, Machine Learning, AI, Analytics, and career growth in India."
              placeholder="Ask anything about data science…"
            />

            {/* Recommended Course */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}>
              <div className="p-5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#b3d0ff" }}>
                  Recommended Course
                </span>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-white mb-2">Data Science Specialization</h3>
                <div className="flex items-center gap-3 mb-4 text-sm text-blue-200">
                  <span>6 months</span>
                  <span style={{ color: "#fbbf24", letterSpacing: "1px" }}>★★★★☆</span>
                  <span className="text-xs">4.8</span>
                </div>
                <button className="glass-btn w-full py-2.5 rounded-xl font-bold text-sm">
                  Enroll Now →
                </button>
              </div>
            </div>

            {/* Recommended for you */}
            <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-[15px] text-on-background dark:text-[#dae2fd] mb-4">Recommended for you</h3>
              <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
                {allPosts.slice(1, 5).map(post => (
                  <Link key={post.id} href={`/article/${post.slug}`} className="flex items-center gap-3 group py-3 first:pt-0 last:pb-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high dark:bg-[#131b2e] shrink-0 relative">
                      {post.image ? (
                        <Image src={post.image} alt="" fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-high dark:bg-[#222a3d]">
                          <span className="material-symbols-outlined text-sm text-outline/40">image</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-semibold leading-snug line-clamp-2 text-on-background dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors mb-1">
                        {post.title}
                      </h4>
                      <span className="text-[11px] text-on-surface-variant dark:text-[#8c909f]">{post.readTime || "5 min read"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Author Spotlight */}
            <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
                style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)", color: "#fff" }}>
                Author Spotlight
              </span>
              <div className="flex items-center gap-3 mb-3">
                {spotlight?.image ? (
                  <Image src={spotlight.image} alt={spotlight.name} width={48} height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center text-on-surface-variant dark:text-[#c2c6d6] font-bold text-base shrink-0">
                    {spotlight?.initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-[14px] text-on-background dark:text-[#dae2fd]">{spotlight?.name}</h4>
                  <p className="text-[12px] text-on-surface-variant dark:text-[#8c909f] leading-snug line-clamp-2 mt-0.5">{spotlight?.bio}</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[12px] text-on-surface-variant dark:text-[#8c909f] pt-3 border-t border-outline-variant/10 dark:border-[#424754]/40">
                <span><strong className="text-on-background dark:text-[#dae2fd] font-bold">34</strong> articles</span>
                <span><strong className="text-on-background dark:text-[#dae2fd] font-bold">{spotlight?.experience?.replace(" Years","") || "15"}</strong> yrs exp</span>
              </div>
            </div>

            {/* Salary Data */}
            <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] mb-5">
                India DS Salaries 2026
              </span>
              <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
                {SALARY_ROWS.map(({ role, range, meta, badge }) => (
                  <div key={role} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[13px] font-bold text-on-background dark:text-[#dae2fd] flex items-center gap-2">
                        {role}
                        {badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide text-white"
                            style={{ background: "linear-gradient(135deg,#4C7FD2,#27416C)" }}>
                            {badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant dark:text-[#8c909f] mt-0.5">{meta}</div>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: "#16a34a" }}>{range}</span>
                  </div>
                ))}
              </div>
              <button className="block w-full mt-5 py-3 rounded-2xl text-sm font-bold text-center text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}>
                Full Salary Report + Calculator →
              </button>
            </div>

          </aside>
        </div>
      </div>

      {/* ── Newsletter + Discussion ─────────────────────────── */}
      <section className="py-14 bg-white dark:bg-[#0b1326]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left col: newsletter card + discussion */}
          <div className="lg:col-span-8">

            {/* Newsletter card */}
            <div className="rounded-2xl p-8 mb-10"
              style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}>
              <h2 className="font-[family-name:var(--font-headline)] font-bold text-xl text-white mb-1">
                Weekly Data Science Digest
              </h2>
              <p className="text-blue-100 text-sm mb-5">Join 50,000+ data professionals. Research, tutorials &amp; career insights, every Friday.</p>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input type="email" placeholder="Enter your work email"
                  value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-white text-gray-800 placeholder:text-gray-400 border-0" />
                <button
                  onClick={() => { if (emailInput.trim()) { addToast("Subscribed! Check your inbox.", "success"); setEmailInput(""); } else addToast("Please enter your email", "error"); }}
                  className="glass-btn px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap">
                  Subscribe →
                </button>
              </div>
              <p className="text-[11px] text-blue-300/70 mt-3">Free gift: Data Science Career Roadmap 2026 PDF on sign-up</p>
            </div>

            {/* Discussion */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-on-background dark:text-[#dae2fd]">
                  Weekly Data Science Digest
                </h3>
                <span className="text-sm text-on-surface-variant dark:text-[#8c909f]">{comments.length} comments</span>
              </div>

              {/* New comment */}
              <div className="flex gap-3 mb-8 items-start">
                <div className="w-9 h-9 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-lg">person</span>
                </div>
                <div className="flex gap-3 flex-1">
                  <input value={commentInput} onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && postComment()}
                    placeholder="Ask a question or share your thoughts..."
                    className="flex-1 px-4 py-3 rounded-xl text-sm outline-none bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60" />
                  <button onClick={postComment}
                    className="glass-chip active px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap self-center">
                    Post
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-4 py-5">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-lg">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{c.user}</span>
                        <span className="text-xs text-on-surface-variant dark:text-[#8c909f]">{c.time}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">{c.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="text-xs font-medium text-on-surface-variant dark:text-[#8c909f] hover:text-primary dark:hover:text-[#adc6ff] flex items-center gap-1 transition-colors">
                          Like <span className="material-symbols-outlined text-sm">favorite_border</span>
                        </button>
                        <button className="text-xs font-medium text-on-surface-variant dark:text-[#8c909f] hover:text-primary dark:hover:text-[#adc6ff] transition-colors">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col: placeholder */}
          <div className="hidden lg:block lg:col-span-4" />
        </div>
      </section>

      {/* ── Related Courses ───────────────────────────────────── */}
      <section className="py-16 border-t bg-surface-container-low dark:bg-[#131b2e] border-outline-variant/10 dark:border-[#424754]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-[family-name:var(--font-headline)] font-bold text-2xl dark:text-[#dae2fd] mb-8">Related Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.slice(0, 3).map(course => (
              <div key={course.id}
                className="flex flex-col rounded-2xl overflow-hidden border bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754] group hover:shadow-lg transition-shadow">
                <div className="aspect-video overflow-hidden relative bg-surface-container-high dark:bg-[#131b2e]">
                  <Image src={course.image} alt={course.title} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-[#adc6ff] mb-2">{course.label}</span>
                  <h3 className="font-[family-name:var(--font-headline)] font-bold text-base dark:text-[#dae2fd] mb-2">{course.title}</h3>
                  <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] mb-4 flex-1 line-clamp-2">{course.desc}</p>
                  <a href="#"
                    className="glass-chip active block w-full text-center py-2.5 rounded-xl font-bold text-sm">
                    View Courses
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
