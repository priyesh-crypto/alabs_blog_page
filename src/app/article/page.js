"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";

/* ── Data ── */
const tocSections = [
  { id: "intro", label: "Introduction" },
  { id: "scalability", label: "The Scalability Bottleneck" },
  { id: "knowledge-check", label: "Knowledge Check" },
  { id: "next-steps", label: "AI-Powered Next Steps" },
  { id: "discussion", label: "Discussion" },
];

const initialComments = [
  {
    id: 1,
    user: "TechAnalyst_42",
    time: "2 hours ago",
    text: "Great breakdown! How does the training stability of LRUs compare to Gated Recurrent Units in very deep networks?",
    likes: 12,
    replies: [
      {
        id: 11,
        user: "AnalytixLabs Support",
        verified: true,
        time: "1 hour ago",
        text: "LRUs actually exhibit much better stability due to the normalization of the diagonal elements, preventing the vanishing gradient issues common in standard GRUs.",
        likes: 4,
      },
    ],
  },
];

import { getPosts, getRecommendations, getCourseMatch, courses } from "@/lib/data";
import NewsletterInline from "@/components/NewsletterInline";

function ArticleContent() {
  const addToast = useToast();
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("intro");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1200);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const post = getPosts()[0]; // Current article mapping
  const recommendedArticles = getRecommendations(post.slug, 3);
  const courseMatch = getCourseMatch(post.domain_tags);

  // Initialize bookmark status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBookmarked(localStorage.getItem(`bookmark_${post.slug}`) === "true");
    }
  }, [post.slug]);

  // Reading progress
  useEffect(() => {
    function handleScroll() {
      const h =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (window.scrollY / h) * 100;
      setProgress(scrolled);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // TOC active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    tocSections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Fade-in sections
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1 }
    );
    document
      .querySelectorAll(".fade-in-section")
      .forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function handleLike() {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  }

  function handleBookmark() {
    const newState = !bookmarked;
    setBookmarked(newState);
    if (newState) {
      localStorage.setItem(`bookmark_${post.slug}`, "true");
    } else {
      localStorage.removeItem(`bookmark_${post.slug}`);
    }
    addToast(
      newState ? "Article saved for later!" : "Removed from saved articles",
      newState ? "success" : "info"
    );
  }

  function handleCopyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => addToast("Link copied to clipboard!", "success"))
      .catch(() => addToast("Failed to copy link", "error"));
  }

  function handleQuizSubmit() {
    if (quizAnswer === null) {
      addToast("Please select an answer.", "error");
      return;
    }
    setQuizSubmitted(true);
    if (quizAnswer === 1) {
      addToast("Correct! LRUs maintain a fixed-size state.", "success");
    } else {
      addToast("Not quite. The answer is: Fixed-size state independent of sequence length.", "error");
    }
  }

  function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) {
      addToast("Please write something!", "error");
      return;
    }
    const comment = {
      id: Date.now(),
      user: "You",
      time: "Just now",
      text: newComment,
      likes: 0,
      replies: [],
    };
    setComments([comment, ...comments]);
    setNewComment("");
    addToast("Comment posted!", "success");
  }

  function handlePostReply(commentId) {
    if (!replyText.trim()) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: Date.now(),
                  user: "You",
                  time: "Just now",
                  text: replyText,
                  likes: 0,
                },
              ],
            }
          : c
      )
    );
    setReplyText("");
    setReplyingTo(null);
    addToast("Reply posted!", "success");
  }

  function handleCommentLike(commentId, replyId = null) {
    setComments((prev) =>
      prev.map((c) => {
        if (replyId && c.id === commentId) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === replyId ? { ...r, likes: r.likes + 1 } : r
            ),
          };
        }
        if (!replyId && c.id === commentId) {
          return { ...c, likes: c.likes + 1 };
        }
        return c;
      })
    );
  }

  return (
    <>
      <Navbar activeCategory="Machine Learning" />

      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 w-full z-40 reading-progress-track">
        <div
          className="reading-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Left Sidebar ─── */}
        <aside className="hidden lg:flex flex-col gap-8 lg:col-span-3">
          <div className="bg-surface-container-low dark:bg-[#131b2e] p-6 rounded-xl flex flex-col gap-4 sticky top-32">
            <div className="flex flex-col gap-3">
              <Image
                alt="Dr. Aris Thorne"
                className="w-16 h-16 rounded-full object-cover grayscale brightness-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARP4_w1bWgGBB5SoK0Qh7-IivwfXOorWXvOYT_pfuLPmIIgS4Y75ySI0mTZcZLdFxFLn1WLhfmWtFa5OxzgPXjmSMHO6hPmsFidLu6Z52TUgPMZqBMwot37VvRpGTIhWU1fsOFajRyWRPboslm2NhrRh5ge7JqkWTDAji7DImf6MY9u9_WV4MLnIkfoXDHdvAvHc3lMa6bNGHnyOskRwxp9nqU4RFgYGn9YN-aZXz2qwSsU4jd8B3E0R6IaUCrm8Jh__ubgCbMI2A8"
                width={64}
                height={64}
              />
              <div>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-on-surface dark:text-[#dae2fd]">
                  Dr. Aris Thorne
                </h3>
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-secondary dark:text-[#c2c6d6]">
                  Chief ML Architect
                </p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">
              Aris leads the AI research division at AnalytixLabs with over 15
              years in predictive modeling and neural architecture search.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-secondary-container dark:bg-[#2d3449] text-on-secondary-container dark:text-[#c2c6d6] rounded-lg font-[family-name:var(--font-label)] text-[10px] uppercase">
                Ph.D Data Science
              </span>
              <span className="px-2 py-1 bg-secondary-container dark:bg-[#2d3449] text-on-secondary-container dark:text-[#c2c6d6] rounded-lg font-[family-name:var(--font-label)] text-[10px] uppercase">
                Top Voice 2024
              </span>
            </div>
            <a
              className="flex items-center gap-2 text-primary dark:text-[#adc6ff] font-[family-name:var(--font-label)] text-xs font-bold mt-2 group"
              href="#"
            >
              CONNECT ON LINKEDIN
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </a>

            <hr className="border-outline-variant/20 dark:border-[#424754] my-2" />

            {/* Table of Contents */}
            <nav className="flex flex-col gap-3">
              <h4 className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-secondary dark:text-[#c2c6d6] mb-2">
                In this article
              </h4>
              {tocSections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`toc-link text-sm pl-3 border-l-2 transition-colors ${
                    activeSection === s.id
                      ? "active"
                      : "text-on-surface-variant dark:text-[#c2c6d6] hover:text-on-surface dark:hover:text-[#dae2fd] border-transparent"
                  }`}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* ─── Article Canvas ─── */}
        <main className="w-full min-w-0 lg:col-span-6 max-w-3xl mx-auto lg:mx-0">
          {/* Header */}
          <header className="mb-12" id="intro">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-tertiary-fixed dark:bg-[#004a77] text-on-tertiary-fixed dark:text-[#cfe5ff] font-[family-name:var(--font-label)] text-xs font-bold rounded-full">
                MACHINE LEARNING
              </span>
              <span className="text-secondary dark:text-[#c2c6d6] text-sm font-[family-name:var(--font-label)] uppercase tracking-widest">
                12 Min Read
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-on-background dark:text-[#dae2fd] leading-[1.1] tracking-tight mb-8">
              Beyond Transformers: The Rise of Linear Recurrent Units
            </h1>

            {/* Meta bar */}
            <div className="flex justify-between items-center py-4 border-y border-outline-variant/10 dark:border-[#424754]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6]">
                  calendar_today
                </span>
                <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">
                  Published Oct 24, 2024
                </span>
              </div>
              <button
                onClick={handleBookmark}
                className={`bookmark-btn flex items-center gap-2 px-4 py-2 hover:bg-surface-container-high dark:hover:bg-[#222a3d] transition-colors rounded-full border border-outline-variant/30 dark:border-[#424754] text-sm font-semibold dark:text-[#dae2fd] ${
                  bookmarked ? "saved" : ""
                }`}
                id="bookmark-btn"
              >
                <span className="material-symbols-outlined text-primary dark:text-[#adc6ff]">
                  bookmark
                </span>
                {bookmarked ? "Saved" : "Save for Later"}
              </button>
            </div>

            {/* Social actions */}
            <div className="flex items-center gap-6 py-4 border-b border-outline-variant/10 dark:border-[#424754] mb-8">
              <button
                onClick={handleLike}
                className={`like-btn flex items-center gap-2 hover:text-primary transition-colors group ${
                  liked ? "liked" : ""
                }`}
                id="like-btn"
              >
                <span className="material-symbols-outlined text-secondary group-hover:text-primary dark:text-[#c2c6d6]">
                  favorite
                </span>
                <span className="text-sm font-bold dark:text-[#dae2fd]">
                  {likeCount >= 1000
                    ? (likeCount / 1000).toFixed(1) + "k"
                    : likeCount}
                </span>
              </button>
              <a
                href="#discussion"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary group-hover:text-primary dark:text-[#c2c6d6]">
                  chat_bubble
                </span>
                <span className="text-sm font-bold dark:text-[#dae2fd]">
                  {comments.length}
                </span>
              </a>
              <div className="relative group/share ml-auto share-trigger">
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-surface-container-high dark:hover:bg-[#222a3d] rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6]">
                    share
                  </span>
                  <span className="text-sm font-bold dark:text-[#dae2fd]">
                    Share
                  </span>
                </button>
                <div className="share-dropdown absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest dark:bg-[#171f33] border border-outline-variant/20 dark:border-[#424754] rounded-xl shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">
                      link
                    </span>
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                        "_blank"
                      );
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors border-t border-outline-variant/10 dark:border-[#424754] dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">
                      share_reviews
                    </span>
                    LinkedIn
                  </button>
                  <button
                    onClick={() => {
                      window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Beyond Transformers: The Rise of Linear Recurrent Units")}`,
                        "_blank"
                      );
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors border-t border-outline-variant/10 dark:border-[#424754] dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">
                      post_add
                    </span>
                    Twitter / X
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ─── Article Content ─── */}
          <article className="prose prose-slate dark:prose-invert max-w-none prose-lg prose-headings:font-[family-name:var(--font-headline)] min-w-0">
            <p className="text-xl font-medium text-on-surface dark:text-[#dae2fd] leading-relaxed mb-10">
              For years, the Transformer architecture has been the undisputed
              king of sequence modeling. However, the quadratic complexity of
              self-attention poses a significant challenge for long-context
              applications. Enter Linear Recurrent Units (LRUs)—a paradigm shift
              promising linear scaling without sacrificing the global modeling
              capabilities of their predecessors.
            </p>

            <h2
              className="text-3xl font-bold mt-12 mb-6 text-on-background dark:text-[#dae2fd]"
              id="scalability"
            >
              The Scalability Bottleneck
            </h2>
            <p className="text-on-surface-variant dark:text-[#c2c6d6] leading-[1.8]">
              Standard attention mechanisms require computing a compatibility
              score between every pair of tokens in a sequence. As we scale to
              contexts of 1M tokens or more, the memory requirements become
              prohibitively expensive. Researchers are now looking back at
              state-space models and recurrent architectures, reimagining them
              through a modern lens.
            </p>

            <NewsletterInline />

            {/* Video Embed */}
            <figure className="my-12 group">
              <div className="aspect-video w-full bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-outline-variant/20 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <button className="w-20 h-20 rounded-full bg-primary/90 text-on-primary flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                    <span
                      className="material-symbols-outlined text-4xl"
                      style={{
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      play_arrow
                    </span>
                  </button>
                  <span className="text-white font-[family-name:var(--font-headline)] font-bold tracking-tight text-lg">
                    Watch: LRU Architecture Deep Dive
                  </span>
                </div>
                <Image
                  alt="Video Thumbnail"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:scale-105 transition-transform duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAHPyDsgBYcTtjV-NE2Zhzp01BKwXVXxil6c1ylMFJ7RrhsppXhw9j1ASXqFFzmAyicWdcymS9Xgkv2s2Jl-2TAp3rMSs8rGuHSUU5zOHV6EvlKYg5tTOfcGYFNwXCfuxVWucmPSIkBCQX9Qe0Y9O_rKZah5nvftyjs0d-KUhN0Wx0tuafnwZyPyltWA0mCd23YALCMUsiLHpdtC_isBnBBH0S1JfguxPMbWlCk8Kxwz-MNDoxcQkqaQEeuc3TOxP3kk3IR9awWVa-"
                  fill
                  sizes="100vw"
                />
              </div>
              <figcaption className="mt-4 text-center text-sm text-secondary dark:text-[#c2c6d6] italic">
                Video: Explaining the mathematical transition from Standard
                Recurrence to Linear Units. (7:42)
              </figcaption>
            </figure>

            {/* Code Block */}
            <div className="my-10 p-6 bg-inverse-surface dark:bg-[#060e20] rounded-xl overflow-x-auto">
              <pre className="text-blue-200 font-mono text-sm leading-relaxed">
                <code>{`# Linear Recurrent Unit Simplification
def lru_update(h_prev, x, Lambda, B):
    # Recurrence with diagonal transition matrix
    h = Lambda * h_prev + B * x
    return h`}</code>
              </pre>
            </div>

            {/* Knowledge Check */}
            <section
              className="my-16 bg-surface-container-highest dark:bg-[#222a3d] p-8 rounded-2xl relative overflow-hidden"
              id="knowledge-check"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">quiz</span>
              </div>
              <div className="relative z-10">
                <h4 className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-primary dark:text-[#adc6ff] font-bold mb-4">
                  Knowledge Check
                </h4>
                <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold mb-6 dark:text-[#dae2fd]">
                  What is the primary advantage of LRUs over standard
                  Transformers during inference?
                </h3>
                <div className="space-y-3">
                  {[
                    "Quadratic computational complexity",
                    "Fixed-size state independent of sequence length",
                    "Requirement for absolute positional encodings",
                  ].map((opt, i) => (
                    <label
                      key={i}
                      className={`quiz-option flex items-center p-4 bg-surface-container-lowest dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] rounded-xl cursor-pointer hover:border-primary transition-all ${
                        quizSubmitted && i === 1
                          ? "correct"
                          : quizSubmitted && quizAnswer === i && i !== 1
                          ? "incorrect"
                          : ""
                      }`}
                    >
                      <input
                        className="w-4 h-4 text-primary border-outline focus:ring-primary"
                        name="mcq"
                        type="radio"
                        checked={quizAnswer === i}
                        onChange={() => !quizSubmitted && setQuizAnswer(i)}
                        disabled={quizSubmitted}
                      />
                      <span className="ml-4 text-sm font-medium dark:text-[#dae2fd]">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleQuizSubmit}
                  disabled={quizSubmitted}
                  className="mt-8 px-8 py-3 bg-primary text-on-primary rounded-full font-[family-name:var(--font-headline)] font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                  id="quiz-submit"
                >
                  {quizSubmitted ? "Submitted ✓" : "Submit Answer"}
                </button>
              </div>
            </section>

            {/* Figure */}
            <figure className="my-16">
              <div className="rounded-2xl overflow-hidden border border-outline-variant/10 dark:border-[#424754] shadow-sm bg-surface-container-low dark:bg-[#131b2e] p-1 relative aspect-[16/9]">
                <Image
                  alt="Efficiency Comparison Chart"
                  className="w-full h-full rounded-xl object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsjmNvdXsEzKI_i7qV02NdTej-yGN8OzaMy79CsY38QTSJGa0rbZ5wX9Mrn_-8QUgzLlhntk4FnL8zZLZlBD-8YaEdf8hedgOS5Igog8FRhY9l_gRRQbV_HhKurJikJLPx7KayHNDWBQc_tBxNPV-_Lu5YSyo0K5cE-THH_Ck8M8KP3kpJvMewyXZyZIkYmrtfivimPTM6d1IMIfo_M0tS1uqH7Is4-qleo2U4AgjnYJDC1ch8pKARM1PjiHojxL3PF-3JDdo7Ob6K"
                  fill
                  sizes="100vw"
                />
              </div>
              <figcaption className="mt-6 px-4 border-l-4 border-primary dark:border-[#adc6ff]">
                <p className="text-base font-bold text-on-surface dark:text-[#dae2fd] mb-1 font-[family-name:var(--font-headline)]">
                  Figure 1.2: Memory Complexity Comparison
                </p>
                <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">
                  A visualization of scaling costs. While Transformers hit a
                  &ldquo;memory wall&rdquo; at 32k tokens, LRUs maintain a
                  constant per-token cost.
                </p>
              </figcaption>
            </figure>

            <p className="text-on-surface-variant dark:text-[#c2c6d6] leading-[1.8]">
              By diagonalizing the transition matrix, LRUs can parallelize
              computations during training (like Transformers) while maintaining
              an O(1) state update during inference (like traditional RNNs). This
              &ldquo;best of both worlds&rdquo; approach is currently driving the
              next wave of LLM efficiency.
            </p>

            {/* AI-Powered Next Steps */}
            <section
              className="mt-16 p-8 bg-blue-50 dark:bg-[#060e20] border border-blue-100 dark:border-[#424754]/30 rounded-3xl"
              id="next-steps"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-xl">
                    smart_toy
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold text-on-background dark:text-[#dae2fd]">
                  AI-Powered Next Steps
                </h3>
              </div>
              <p className="text-on-surface-variant dark:text-[#c2c6d6] mb-8 text-lg">
                Great progress on LRUs! Based on your reading, what would you
                like to do next?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "assignment_turned_in", label: "Take a quick quiz" },
                  { icon: "picture_as_pdf", label: "Download PDF Guide" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() =>
                      addToast(`${btn.label} — feature coming soon!`, "info")
                    }
                    className="flex items-center gap-4 p-4 bg-surface-container-lowest dark:bg-[#131b2e] hover:bg-primary hover:text-on-primary border border-outline-variant/20 dark:border-[#424754] rounded-2xl transition-all group text-left"
                  >
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary dark:text-[#adc6ff]">
                      {btn.icon}
                    </span>
                    <span className="text-sm font-bold dark:text-[#dae2fd] group-hover:text-white">
                      {btn.label}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() =>
                    addToast("Curriculum page coming soon!", "info")
                  }
                  className="flex items-center gap-4 p-4 bg-surface-container-lowest dark:bg-[#131b2e] hover:bg-primary hover:text-on-primary border border-outline-variant/20 dark:border-[#424754] rounded-2xl transition-all group text-left sm:col-span-2"
                >
                  <span className="material-symbols-outlined text-primary group-hover:text-on-primary dark:text-[#adc6ff]">
                    school
                  </span>
                  <span className="text-sm font-bold dark:text-[#dae2fd] group-hover:text-white">
                    View Master Deep Learning curriculum
                  </span>
                </button>
              </div>
            </section>

            {/* Related Course CTA */}
            <section className="bg-surface-container-low dark:bg-[#131b2e] rounded-xl border border-outline-variant/10 dark:border-[#424754]/20 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center mt-12 mb-8 min-w-0">
              <div className="flex-1 w-full space-y-4 min-w-0">
                <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.2em] font-bold text-primary dark:text-[#adc6ff] mb-2 px-3 py-1 bg-primary-container dark:bg-[#004a77] rounded-full inline-block">
                  {courseMatch.label || "COURSE"}
                </span>
                <h2 className="font-[family-name:var(--font-headline)] font-bold text-2xl dark:text-[#dae2fd]">
                  {courseMatch.title}
                </h2>
                <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm leading-relaxed max-w-md">
                  {courseMatch.desc}
                </p>
                <button className="px-6 py-3 bg-on-background dark:bg-[#dae2fd] text-background dark:text-[#0b1326] rounded-full font-[family-name:var(--font-headline)] font-bold text-xs uppercase tracking-wider hover:bg-primary dark:hover:bg-[#adc6ff] hover:text-white dark:hover:text-[#0b1326] transition-colors mt-2">
                  Explore Curriculum →
                </button>
              </div>
              <div className="w-full md:w-1/3 aspect-[4/3] relative rounded-xl overflow-hidden shrink-0 border border-outline/10">
                <Image
                  src={courseMatch.image}
                  alt={courseMatch.title}
                  fill
                  className="object-cover"
                />
              </div>
            </section>
          </article>

          {/* ─── Discussion Section ─── */}
          <section
            className="mt-24 pt-12 border-t border-outline-variant/20 dark:border-[#424754]"
            id="discussion"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-[family-name:var(--font-headline)] text-3xl font-extrabold text-on-background dark:text-[#dae2fd]">
                Discussion
              </h2>
              <span className="text-secondary dark:text-[#c2c6d6] text-sm font-[family-name:var(--font-label)] uppercase tracking-widest font-bold">
                {comments.length + comments.reduce((a, c) => a + c.replies.length, 0)} Comments
              </span>
            </div>

            {/* Add Comment */}
            <form
              onSubmit={handlePostComment}
              className="mb-12 flex gap-3 sm:gap-4 p-4 sm:p-6 bg-surface-container-low dark:bg-[#131b2e] rounded-2xl border border-outline-variant/10 dark:border-[#424754]"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-xl sm:text-2xl">
                  person
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <textarea
                  className="w-full p-4 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline/60 dark:placeholder:text-slate-500 resize-none"
                  placeholder="Join the discussion..."
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  id="comment-textarea"
                />
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex gap-2">
                    {["format_bold", "format_italic", "link"].map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className="p-2 text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] transition-colors hover:bg-surface-container-high dark:hover:bg-[#222a3d] rounded-lg"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {icon}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-full font-[family-name:var(--font-headline)] font-bold text-sm shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                    id="post-comment-btn"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-10">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-xl">
                      person
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">
                        {comment.user}
                      </span>
                      <span className="text-[10px] text-secondary dark:text-[#8c909f] font-[family-name:var(--font-label)] uppercase font-bold tracking-wider">
                        {comment.time}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-3">
                      {comment.text}
                    </p>
                    <div className="flex gap-6 items-center">
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="text-xs font-bold text-primary dark:text-[#adc6ff] hover:underline"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className="flex items-center gap-1.5 text-xs text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          thumb_up
                        </span>
                        <span className="font-bold">{comment.likes}</span>
                      </button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="reply-form show mt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            className="flex-1 p-3 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <button
                            onClick={() => handlePostReply(comment.id)}
                            className="w-full sm:w-auto px-6 py-2 bg-primary text-on-primary rounded-full font-bold text-sm whitespace-nowrap"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="mt-8 flex gap-4 pl-6 border-l-2 border-outline-variant/10 dark:border-[#424754]"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#222a3d] flex items-center justify-center shrink-0">
                          {reply.verified ? (
                            <span
                              className="material-symbols-outlined text-blue-700 dark:text-[#adc6ff] text-sm"
                              style={{
                                fontVariationSettings: "'FILL' 1",
                              }}
                            >
                              verified
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-secondary text-sm">
                              person
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-bold text-sm ${
                                reply.verified
                                  ? "text-primary dark:text-[#adc6ff]"
                                  : "text-on-background dark:text-[#dae2fd]"
                              }`}
                            >
                              {reply.user}
                            </span>
                            <span className="text-[10px] text-secondary dark:text-[#8c909f] font-[family-name:var(--font-label)] uppercase font-bold tracking-wider">
                              {reply.time}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-2">
                            {reply.text}
                          </p>
                          <div className="flex gap-4 items-center">
                            <button className="text-[11px] font-bold text-primary dark:text-[#adc6ff] hover:underline">
                              Reply
                            </button>
                            <button
                              onClick={() =>
                                handleCommentLike(comment.id, reply.id)
                              }
                              className="flex items-center gap-1 text-[11px] text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                thumb_up
                              </span>
                              <span className="font-bold">{reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ─── Right Sidebar ─── */}
        <aside className="hidden lg:flex flex-col gap-8 lg:col-span-3">
          <div className="sticky top-24 flex flex-col gap-8 h-fit">
            {/* Search Bar */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest dark:focus:bg-[#060e20] transition-all placeholder:text-outline/60 dark:placeholder:text-[#8c909f]"
                placeholder="Search within blog..."
                type="text"
              />
            </div>

            {/* AI Recommended */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-headline)] text-lg font-bold dark:text-[#dae2fd]">
                  AI Recommended
                </h2>
                <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-xl">
                  auto_awesome
                </span>
              </div>
              <ul className="space-y-6">
                {recommendedArticles.map((item) => (
                  <li key={item.id}>
                    <Link className="group block" href="/article">
                      <p className="text-[10px] font-[family-name:var(--font-label)] uppercase text-slate-400 dark:text-[#8c909f] mb-1">
                        {item.category}
                      </p>
                      <h5 className="text-sm font-bold font-[family-name:var(--font-headline)] leading-tight group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">
                        {item.title}
                      </h5>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Related Courses ── */}
      <section className="bg-surface-container-low dark:bg-[#131b2e] py-20 border-t border-outline-variant/10 dark:border-[#424754] fade-in-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-headline)] text-3xl font-extrabold text-on-background dark:text-[#dae2fd] mb-2">
                Related Courses
              </h2>
              <p className="text-on-surface-variant dark:text-[#c2c6d6]">
                Accelerate your career with our industry-leading certification
                programs.
              </p>
            </div>
            <a
              className="text-primary dark:text-[#adc6ff] font-[family-name:var(--font-label)] text-sm font-bold flex items-center gap-2 hover:underline group"
              href="#"
            >
              View All Courses
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.title}
                className="bg-surface-container-lowest dark:bg-[#0b1326] rounded-2xl overflow-hidden border border-outline-variant/20 dark:border-[#424754] flex flex-col shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video overflow-hidden relative">
                  <Image
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={course.image}
                    fill
                    sizes="33vw"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold mb-3 group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">
                    {course.title}
                  </h3>
                  <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm mb-6 flex-1">
                    {course.desc}
                  </p>
                  <a
                    className="w-full text-center py-3 bg-surface-container-high dark:bg-[#2d3449] hover:bg-primary hover:text-on-primary dark:hover:bg-[#4d8eff] dark:hover:text-[#0b1326] transition-colors rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm text-on-surface dark:text-[#dae2fd] block"
                    href="#"
                  >
                    View Course
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

export default function ArticlePage() {
  return (
    <ToastProvider>
      <ArticleContent />
    </ToastProvider>
  );
}
