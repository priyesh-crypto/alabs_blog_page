"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import Newsletter from "@/components/Newsletter";
import { ToastProvider, useToast } from "@/components/Toast";
import { getPosts, tags, skillLevels, courses, searchPosts } from "@/lib/data";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTopic, setActiveTopic] = useState(searchParams.get("topic") || null);
  const [activeSkill, setActiveSkill] = useState(searchParams.get("skill") || null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeFilterCategory, setActiveFilterCategory] = useState("topics"); // "topics" or "skills"
  const addToast = useToast();
  const sectionsRef = useRef([]);

  // Fade-in observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in-section").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const createQueryString = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    return params.toString();
  };

  const handleTopicSelection = (tag) => {
    const newTopic = activeTopic === tag ? null : tag;
    setActiveTopic(newTopic);
    router.push(`${pathname}?${createQueryString("topic", newTopic)}`);
  };

  const handleSkillSelection = (skill) => {
    const newSkill = activeSkill === skill ? null : skill;
    setActiveSkill(newSkill);
    router.push(`${pathname}?${createQueryString("skill", newSkill)}`);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    router.push(`${pathname}?${createQueryString("q", val)}`);
  };

  const filteredPosts = searchPosts(searchQuery, activeTopic, activeSkill);

  return (
    <>
      <Navbar activeCategory="Data Science" />

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        {/* ── Hero ── */}
        <section className="mb-16 fade-in-section">
          <Link href="/article" className="block">
            <div className="relative w-full aspect-square md:aspect-[21/9] rounded-3xl overflow-hidden group cursor-pointer">
              <Image
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWH0-iy0YexEmNgbb6xT4xV9b6GsoFnY_9aUMH6fTFAQclaeR3Q3aaUejHYtdNeoOUCTHo8msFSglbimLSEzN8cRXBVovh6XHhCo8N7AGOkSGG7g42Soi0OGcBxTncG9BuB7d3Q885lglT_5HxweffsUakx3AzCrpMIEhhDwPn5bNo8LmtHlY3K0HomYlDlJZ_6y4dfViCcAmAEtc4Uji5B7X82cLIVqrEJZuSbAuamU0ZRAZZl5bXiz7fveiMJcorj_U3ODpBe3kQ"
                alt="High-tech data visualization with blue and purple neon light streaks"
                fill
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent dark:from-[#0b1326] dark:via-[#0b1326]/40" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                <span className="inline-block px-3 py-1 bg-primary text-white font-[family-name:var(--font-label)] text-xs uppercase tracking-widest rounded-full mb-4">
                  Featured Analysis
                </span>
                <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-3xl md:text-5xl text-white mb-6 leading-tight tracking-tighter">
                  Large Language Models: Architecting the Future of Enterprise
                  Intelligence
                </h1>
                <div className="flex items-center gap-6">
                  <span className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-3 rounded-full font-[family-name:var(--font-headline)] font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
                    Read More{" "}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </span>
                  <div className="flex items-center gap-2 text-white/80 font-[family-name:var(--font-label)] text-sm">
                    <span className="material-symbols-outlined text-sm">
                      schedule
                    </span>
                    12 min read
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Discovery & Filter ── */}
        <section className="mb-12 space-y-8 fade-in-section">
          <div className="bg-surface-container-low dark:bg-[#131b2e] p-6 rounded-xl flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                search
              </span>
              <input
                className="w-full bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border-none rounded-full py-4 pl-12 pr-6 font-[family-name:var(--font-body)] text-sm focus:ring-2 focus:ring-primary/20 dark:focus:ring-[#adc6ff]/20 transition-shadow shadow-sm"
                placeholder="Search insights using semantic queries..."
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                id="search-input"
              />
            </div>
            <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => setActiveFilterCategory("topics")}
                className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-[family-name:var(--font-label)] transition-colors whitespace-nowrap ${
                  activeFilterCategory === "topics" 
                  ? "bg-primary text-white border-primary" 
                  : "bg-surface-container-lowest dark:bg-[#060e20] border-outline-variant/15 dark:border-[#424754]/30 text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary dark:hover:border-[#adc6ff]/40"
                }`}>
                <span className="material-symbols-outlined text-sm">
                  filter_list
                </span>
                Topics
                {activeTopic && <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">1</span>}
              </button>
              <button 
                onClick={() => setActiveFilterCategory("skills")}
                className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-[family-name:var(--font-label)] transition-colors whitespace-nowrap ${
                  activeFilterCategory === "skills" 
                  ? "bg-primary text-white border-primary" 
                  : "bg-surface-container-lowest dark:bg-[#060e20] border-outline-variant/15 dark:border-[#424754]/30 text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary dark:hover:border-[#adc6ff]/40"
                }`}>
                <span className="material-symbols-outlined text-sm">
                  school
                </span>
                Skill Level
                {activeSkill && <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">1</span>}
              </button>
              <button 
                onClick={() => {
                  setActiveTopic(null);
                  setActiveSkill(null);
                  setSearchQuery("");
                  router.push(pathname);
                }}
                className="flex items-center gap-2 bg-secondary-container text-on-secondary-container dark:bg-[#2d3449] dark:text-[#c2c6d6] px-5 py-3 rounded-full text-sm font-[family-name:var(--font-label)] transition-colors whitespace-nowrap">
                Clear Filters
              </button>
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-2">
            {activeFilterCategory === "topics" && tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTopicSelection(tag)}
                className={`tag-chip bg-secondary-container dark:bg-[#2d3449] text-on-secondary-container dark:text-[#c2c6d6] px-4 py-1.5 rounded-full font-[family-name:var(--font-label)] text-xs ${
                  activeTopic === tag ? "!bg-primary !text-white" : ""
                }`}
              >
                #{tag}
              </button>
            ))}
            {activeFilterCategory === "skills" && skillLevels.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillSelection(skill)}
                className={`tag-chip bg-surface-container-high dark:bg-[#1f2937] text-on-surface dark:text-[#dae2fd] px-4 py-1.5 rounded-full font-[family-name:var(--font-label)] text-xs border border-outline/20 ${
                  activeSkill === skill ? "!bg-primary !text-white !border-primary" : ""
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        {/* ── Content Grid ── */}
        <div className="asymmetric-grid">
          {/* Blog Posts */}
          <section className="space-y-8 fade-in-section">
            <h2 className="font-[family-name:var(--font-headline)] font-extrabold text-2xl tracking-tight flex items-center gap-3 dark:text-[#dae2fd]">
              Recent blog posts
              <div className="h-px flex-1 bg-surface-container-highest dark:bg-[#424754]" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredPosts.length === 0 && (
                <p className="text-slate-500 col-span-2 text-center py-12">
                  No posts match your filters. Try a different search or tag.
                </p>
              )}
              {filteredPosts.map((post) => (
                <Link href="/article" key={post.id}>
                  <div className="blog-card group bg-surface-container-low dark:bg-[#131b2e] hover:bg-surface-container-lowest dark:hover:bg-[#171f33] transition-all duration-300 rounded-xl overflow-hidden hover:shadow-[0_32px_64px_-12px_rgba(25,28,30,0.06)] dark:hover:shadow-[0_32px_64px_-12px_rgba(6,14,32,0.5)]">
                    <div className="aspect-[16/9] overflow-hidden relative">
                      <Image
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-primary dark:text-[#adc6ff] font-bold">
                          {post.category}
                        </span>
                        <span className="text-slate-500 dark:text-[#c2c6d6] text-xs font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">
                            schedule
                          </span>
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="font-[family-name:var(--font-headline)] font-bold text-xl leading-snug group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">
                        {post.title}
                      </h3>
                      <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="pt-4 flex items-center justify-between border-t border-outline-variant/10 dark:border-[#424754]/30">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full ${post.author?.color} flex items-center justify-center text-[10px] text-white font-bold`}
                          >
                            {post.author?.initials}
                          </div>
                          <span className="font-[family-name:var(--font-label)] text-xs font-bold dark:text-[#dae2fd]">
                            {post.author?.name}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">
                          north_east
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="space-y-12 pt-16 fade-in-section">
            {/* AI Recommendations */}
            <div className="bg-surface-container-lowest dark:bg-[#131b2e] p-8 rounded-xl border border-outline-variant/10 dark:border-[#424754]/20 shadow-sm dark:shadow-[#060e20]/20">
              <div className="flex items-center gap-2 text-primary dark:text-[#adc6ff] mb-6">
                <span className="material-symbols-outlined filled">
                  auto_awesome
                </span>
                <h4 className="font-[family-name:var(--font-headline)] font-bold text-sm uppercase tracking-wider">
                  Recommended for you
                </h4>
              </div>
              <ul className="space-y-6">
                {[
                  { cat: "Deep Learning", title: "Understanding Transformers via Visual Manifolds" },
                  { cat: "Career Growth", title: "How to Build a High-Impact Data Portfolio in 2024" },
                  { cat: "Ethics & AI", title: "The Bias Bottleneck: Addressing Fairness in LLMs" },
                ].map((item) => (
                  <li key={item.title}>
                    <Link className="group block" href="/article">
                      <p className="text-[10px] font-[family-name:var(--font-label)] uppercase text-slate-400 dark:text-[#8c909f] mb-1">
                        {item.cat}
                      </p>
                      <h5 className="text-sm font-bold font-[family-name:var(--font-headline)] leading-tight group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">
                        {item.title}
                      </h5>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <Newsletter />

            {/* Author Spotlight */}
            <div className="p-4 rounded-xl border-l-4 border-primary dark:border-[#adc6ff] bg-surface-container-low dark:bg-[#131b2e]">
              <p className="text-xs font-[family-name:var(--font-label)] text-slate-500 dark:text-[#8c909f] mb-2">
                AUTHOR SPOTLIGHT
              </p>
              <div className="flex items-center gap-3">
                <Image
                  className="w-10 h-10 rounded-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa5v3wRIJbHGPoQAOXuc01vgv2VY6lR4dG83mx3QHMCLGMd49mcklgom8qQHY5PFe6dYREixEg0tZoN1uy4yR1_o_q3LwWNowhCwA0WkTRvnmxLMRO55kKxOdUf0YidqYo9k4uHcyDs0WxXEiWCP-pujigKglmKAV_AGgmPpfJIRtSg69T2OVJsR7sRJ4hUKbLGcvGOSWBNDaAiOFEX0WbS-mTUWe2gNrZFvb2lPSGDr4RpsoVxOm2aiH-Hu_HkJWTw6OPxWJQS_fU"
                  alt="Dr. Elena Rodriguez"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-sm font-bold font-[family-name:var(--font-headline)] dark:text-[#dae2fd]">
                    Dr. Elena Rodriguez
                  </p>
                  <p className="text-[10px] font-[family-name:var(--font-label)] text-slate-400">
                    Head of Research at AnalytixLabs
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Courses ── */}
      <section className="max-w-7xl mx-auto px-6 mb-20 fade-in-section" id="courses">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="font-[family-name:var(--font-headline)] font-extrabold text-2xl tracking-tight dark:text-[#dae2fd]">
            Related Courses
          </h2>
          <Link
            className="flex items-center gap-1 text-primary dark:text-[#ffb787] font-[family-name:var(--font-headline)] font-bold text-sm hover:opacity-80 transition-opacity ml-auto"
            href="#"
          >
            View All Courses
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
          <div className="h-px bg-surface-container-highest dark:bg-[#424754] w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course.title}
              className="bg-surface-container-low dark:bg-[#131b2e] rounded-xl overflow-hidden border border-outline-variant/10 dark:border-[#424754]/20 flex flex-col group"
            >
              <div className="aspect-video overflow-hidden relative">
                <Image
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={course.image}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-primary dark:text-[#adc6ff] font-bold mb-2">
                  {course.label}
                </span>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg mb-2 dark:text-[#dae2fd]">
                  {course.title}
                </h3>
                <p className="text-slate-600 dark:text-[#c2c6d6] text-sm mb-6 line-clamp-2">
                  {course.desc}
                </p>
                <button className="mt-auto w-full py-3 rounded-lg bg-surface-container-highest dark:bg-[#222a3d] text-primary dark:text-[#adc6ff] font-[family-name:var(--font-headline)] font-bold text-sm hover:bg-primary hover:text-white dark:hover:bg-[#4d8eff] dark:hover:text-[#0b1326] transition-all">
                  View Course
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <MobileBottomNav activePage="home" />
    </>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Content...</div>}>
        <HomeContent />
      </Suspense>
    </ToastProvider>
  );
}
