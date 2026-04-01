"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";
import { courses } from "@/lib/data";
import NewsletterInline from "@/components/NewsletterInline";
import "@/components/TiptapEditor.css";

const initialComments = [
  {
    id: 1,
    user: "TechAnalyst_42",
    time: "2 hours ago",
    text: "Great breakdown! The depth of analysis here is impressive.",
    likes: 12,
    replies: [
      {
        id: 11,
        user: "AnalytixLabs Support",
        verified: true,
        time: "1 hour ago",
        text: "Thank you for reading! Feel free to share your thoughts in the discussion.",
        likes: 4,
      },
    ],
  },
];

function ArticleContent({ post, recommendedArticles, courseMatch }) {
  const addToast = useToast();
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState([]);
  const [activeSection, setActiveSection] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showMobileToc, setShowMobileToc] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [likedComments, setLikedComments] = useState(new Set());

  const articleRef = useRef(null);

  const author = post.author || {};

  // Initialize bookmark, like state, and comments from localStorage
  useEffect(() => {
    setBookmarked(localStorage.getItem(`bookmark_${post.slug}`) === "true");
    const wasLiked = localStorage.getItem(`like_${post.slug}`) === "true";
    setLiked(wasLiked);
    const storedCount = localStorage.getItem(`likeCount_${post.slug}`);
    if (storedCount !== null) setLikeCount(Number(storedCount));
    const storedComments = localStorage.getItem(`comments_${post.slug}`);
    if (storedComments) {
      try { setComments(JSON.parse(storedComments)); } catch {}
    }
    const storedLikedComments = localStorage.getItem(`likedComments_${post.slug}`);
    if (storedLikedComments) {
      try { setLikedComments(new Set(JSON.parse(storedLikedComments))); } catch {}
    }
  }, [post.slug]);

  // Persist comments to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`comments_${post.slug}`, JSON.stringify(comments));
    }
  }, [comments, post.slug]);

  // Reading progress
  useEffect(() => {
    function handleScroll() {
      const h =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = h > 0 ? (window.scrollY / h) * 100 : 0;
      setProgress(scrolled);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-generate TOC from rendered headings + inject IDs
  useEffect(() => {
    if (!articleRef.current) return;
    const headings = articleRef.current.querySelectorAll("h2, h3");
    const extracted = [];
    headings.forEach((h, i) => {
      const id =
        h.textContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        i;
      h.id = id;
      extracted.push({ id, label: h.textContent.trim(), level: h.tagName.toLowerCase() });
    });
    setToc(extracted);
    if (extracted.length > 0) setActiveSection(extracted[0].id);
  }, [post.content]);

  // TOC intersection observer (re-runs when toc changes)
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    toc.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);

  // Fade-in sections
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

  function handleLike() {
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newCount);
    localStorage.setItem(`like_${post.slug}`, String(newLiked));
    localStorage.setItem(`likeCount_${post.slug}`, String(newCount));
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
    const questions = post.quiz?.questions || [];
    const correct = questions[activeQuizIndex]?.correctIndex;
    setQuizSubmitted(true);
    if (quizAnswer === correct) {
      addToast("Correct! Well done.", "success");
    } else {
      addToast("Not quite — try re-reading the article.", "error");
    }
  }

  function handleNextQuestion() {
    const questions = post.quiz?.questions || [];
    if (activeQuizIndex < questions.length - 1) {
      setActiveQuizIndex(activeQuizIndex + 1);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  }

  function handleSidebarSearch(e) {
    if (e.key === "Enter" && sidebarSearch.trim()) {
      window.location.href = `/?q=${encodeURIComponent(sidebarSearch.trim())}`;
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
                { id: Date.now(), user: "You", time: "Just now", text: replyText, likes: 0 },
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
    const key = replyId ? `${commentId}_${replyId}` : `${commentId}`;
    const alreadyLiked = likedComments.has(key);
    const delta = alreadyLiked ? -1 : 1;

    const newLikedComments = new Set(likedComments);
    if (alreadyLiked) newLikedComments.delete(key);
    else newLikedComments.add(key);
    setLikedComments(newLikedComments);
    localStorage.setItem(`likedComments_${post.slug}`, JSON.stringify([...newLikedComments]));

    setComments((prev) =>
      prev.map((c) => {
        if (replyId && c.id === commentId) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === replyId ? { ...r, likes: r.likes + delta } : r
            ),
          };
        }
        if (!replyId && c.id === commentId) return { ...c, likes: c.likes + delta };
        return c;
      })
    );
  }

  return (
    <>
      <Navbar activeCategory={post.category} />

      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 w-full z-40 reading-progress-track">
        <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-12 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Left Sidebar ─── */}
        <aside className="hidden lg:flex flex-col gap-8 lg:col-span-3">
          <div className="bg-surface-container-low dark:bg-[#131b2e] p-6 rounded-xl flex flex-col gap-4 sticky top-32">
            <div className="flex flex-col gap-3">
              {author.image ? (
                <Image
                  alt={author.name || "Author"}
                  className="w-16 h-16 rounded-full object-cover grayscale brightness-110"
                  src={author.image}
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xl">
                  {author.initials || "?"}
                </div>
              )}
              <div>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-on-surface dark:text-[#dae2fd]">
                  {author.name || "Author"}
                </h3>
                <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-secondary dark:text-[#c2c6d6]">
                  {author.expertise?.[0] || "Contributor"}
                </p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed">
              {author.bio || ""}
            </p>
            {author.expertise && (
              <div className="flex flex-wrap gap-2">
                {author.expertise.slice(0, 2).map((exp) => (
                  <span
                    key={exp}
                    className="px-2 py-1 bg-secondary-container dark:bg-[#2d3449] text-on-secondary-container dark:text-[#c2c6d6] rounded-lg font-[family-name:var(--font-label)] text-[10px] uppercase"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            )}
            {author.linkedin && (
              <a
                className="flex items-center gap-2 text-primary dark:text-[#adc6ff] font-[family-name:var(--font-label)] text-xs font-bold mt-2 group"
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                CONNECT ON LINKEDIN
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </a>
            )}

            {toc.length > 0 && (
              <>
                <hr className="border-outline-variant/20 dark:border-[#424754] my-2" />
                <nav className="flex flex-col gap-3">
                  <h4 className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-secondary dark:text-[#c2c6d6] mb-2">
                    In this article
                  </h4>
                  {toc.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`toc-link text-sm pl-3 border-l-2 transition-colors ${
                        activeSection === s.id
                          ? "active"
                          : "text-on-surface-variant dark:text-[#c2c6d6] hover:text-on-surface dark:hover:text-[#dae2fd] border-transparent"
                      } ${s.level === "h3" ? "pl-6 text-xs" : ""}`}
                    >
                      {s.label}
                    </a>
                  ))}
                </nav>
              </>
            )}
          </div>
        </aside>

        {/* ─── Article Canvas ─── */}
        <main className="w-full min-w-0 lg:col-span-6 max-w-3xl mx-auto lg:mx-0">
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-tertiary-fixed dark:bg-[#004a77] text-on-tertiary-fixed dark:text-[#cfe5ff] font-[family-name:var(--font-label)] text-xs font-bold rounded-full">
                {post.category?.toUpperCase() || "ARTICLE"}
              </span>
              {post.skill_level && (
                <span className={`px-3 py-1 font-[family-name:var(--font-label)] text-xs font-bold rounded-full ${
                  post.skill_level === "Beginner"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : post.skill_level === "Intermediate"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                  {post.skill_level}
                </span>
              )}
              <span className="flex items-center gap-1 text-secondary dark:text-[#c2c6d6] text-sm font-[family-name:var(--font-label)]">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {post.readTime}
              </span>
            </div>
            <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-on-background dark:text-[#dae2fd] leading-[1.1] tracking-tight mb-8">
              {post.title}
            </h1>

            {/* Mobile TOC toggle */}
            {toc.length > 0 && (
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setShowMobileToc(!showMobileToc)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] rounded-xl text-sm font-semibold dark:text-[#dae2fd] w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-sm">list</span>
                    Contents ({toc.length} sections)
                  </span>
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-sm transition-transform" style={{ transform: showMobileToc ? "rotate(180deg)" : "rotate(0deg)" }}>
                    expand_more
                  </span>
                </button>
                {showMobileToc && (
                  <nav className="mt-2 p-4 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] rounded-xl flex flex-col gap-2">
                    {toc.map((s) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        onClick={() => setShowMobileToc(false)}
                        className={`text-sm pl-3 border-l-2 transition-colors ${
                          activeSection === s.id
                            ? "border-primary dark:border-[#adc6ff] text-primary dark:text-[#adc6ff] font-semibold"
                            : "border-transparent text-on-surface-variant dark:text-[#c2c6d6]"
                        } ${s.level === "h3" ? "pl-6 text-xs" : ""}`}
                      >
                        {s.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Meta bar */}
            <div className="flex flex-wrap justify-between items-center py-4 border-y border-outline-variant/10 dark:border-[#424754] gap-3">
              <div className="flex flex-wrap items-center gap-4">
                {author.name && (
                  <Link href={`/author/${author.slug}`} className="flex items-center gap-2 group">
                    {author.image ? (
                      <Image src={author.image} alt={author.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-[10px]">
                        {author.initials || "?"}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-on-surface dark:text-[#dae2fd] group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors">{author.name}</span>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-sm">calendar_today</span>
                  <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">{post.publishedAt}</span>
                </div>
                {post.updatedAt && post.updatedAt !== post.publishedAt && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-sm">update</span>
                    <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">Updated {post.updatedAt}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleBookmark}
                className={`bookmark-btn flex items-center gap-2 px-4 py-2 hover:bg-surface-container-high dark:hover:bg-[#222a3d] transition-colors rounded-full border border-outline-variant/30 dark:border-[#424754] text-sm font-semibold dark:text-[#dae2fd] ${
                  bookmarked ? "saved" : ""
                }`}
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
                className={`like-btn flex items-center gap-2 hover:text-primary transition-colors group ${liked ? "liked" : ""}`}
              >
                <span className="material-symbols-outlined text-secondary group-hover:text-primary dark:text-[#c2c6d6]">
                  favorite
                </span>
                <span className="text-sm font-bold dark:text-[#dae2fd]">
                  {likeCount >= 1000 ? (likeCount / 1000).toFixed(1) + "k" : likeCount}
                </span>
              </button>
              <a
                href="#discussion"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <span className="material-symbols-outlined text-secondary group-hover:text-primary dark:text-[#c2c6d6]">
                  chat_bubble
                </span>
                <span className="text-sm font-bold dark:text-[#dae2fd]">{comments.length}</span>
              </a>
              <div className="relative group/share ml-auto share-trigger">
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-surface-container-high dark:hover:bg-[#222a3d] rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6]">share</span>
                  <span className="text-sm font-bold dark:text-[#dae2fd]">Share</span>
                </button>
                <div className="share-dropdown absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest dark:bg-[#171f33] border border-outline-variant/20 dark:border-[#424754] rounded-xl shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">link</span>
                    Copy Link
                  </button>
                  <button
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors border-t border-outline-variant/10 dark:border-[#424754] dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">share_reviews</span>
                    LinkedIn
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, "_blank")}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] transition-colors border-t border-outline-variant/10 dark:border-[#424754] dark:text-[#dae2fd]"
                  >
                    <span className="material-symbols-outlined text-base">post_add</span>
                    Twitter / X
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ─── Article Content ─── */}
          <article className="prose max-w-none min-w-0" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {post.content && post.content.startsWith("<") ? (
              <div
                ref={articleRef}
                className="tiptap-prose"
                style={{ fontSize: "21px", lineHeight: "1.6", color: "#242424" }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-xl font-medium text-on-surface dark:text-[#dae2fd] leading-relaxed mb-10">
                {post.excerpt}
              </p>
            )}

            {/* ─── Inline Knowledge Check ─── */}
            {post.quiz?.questions?.length > 0 && (() => {
              const questions = post.quiz.questions;
              const q = questions[activeQuizIndex];
              return (
                <div className="my-10 p-6 bg-primary/5 dark:bg-[#1a2540] rounded-2xl border border-primary/20 dark:border-[#adc6ff]/20">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                      <h3 className="font-[family-name:var(--font-headline)] font-bold text-base dark:text-[#dae2fd]">
                        Quick Knowledge Check
                      </h3>
                    </div>
                    <span className="text-xs font-[family-name:var(--font-label)] font-bold text-secondary dark:text-[#8c909f] uppercase tracking-wider">
                      {activeQuizIndex + 1} / {questions.length}
                    </span>
                  </div>
                  <p className="text-on-surface dark:text-[#dae2fd] font-medium mb-5 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="space-y-3 mb-5">
                    {q.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !quizSubmitted && setQuizAnswer(idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          quizSubmitted
                            ? idx === q.correctIndex
                              ? "bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 font-semibold"
                              : idx === quizAnswer
                              ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300"
                              : "bg-surface-container-lowest dark:bg-[#060e20] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] opacity-40"
                            : quizAnswer === idx
                            ? "bg-primary/10 dark:bg-[#adc6ff]/10 border-primary dark:border-[#adc6ff] text-on-surface dark:text-[#dae2fd]"
                            : "bg-surface-container-lowest dark:bg-[#060e20] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/50 dark:hover:border-[#adc6ff]/50 cursor-pointer"
                        }`}
                      >
                        <span className="font-bold mr-2 text-primary dark:text-[#adc6ff]">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {option}
                        {quizSubmitted && idx === q.correctIndex && (
                          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm ml-2 align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-[family-name:var(--font-headline)] font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`flex items-center gap-1.5 text-sm font-bold ${
                        quizAnswer === q.correctIndex ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {quizAnswer === q.correctIndex ? "check_circle" : "cancel"}
                        </span>
                        {quizAnswer === q.correctIndex
                          ? "Correct! Keep learning."
                          : `Correct: ${q.options[q.correctIndex]}`}
                      </span>
                      {activeQuizIndex < questions.length - 1 && (
                        <button
                          onClick={handleNextQuestion}
                          className="flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-full font-[family-name:var(--font-headline)] font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                          Next Question
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <NewsletterInline />

            {/* Related Course CTA */}
            {courseMatch && (
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
                  <Image src={courseMatch.image} alt={courseMatch.title} fill className="object-cover" />
                </div>
              </section>
            )}
          </article>

          {/* ─── Discussion Section ─── */}
          <section className="mt-24 pt-12 border-t border-outline-variant/20 dark:border-[#424754]" id="discussion">
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
                <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-xl sm:text-2xl">person</span>
              </div>
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <textarea
                  className="w-full p-4 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline/60 dark:placeholder:text-slate-500 resize-none"
                  placeholder="Join the discussion..."
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-[family-name:var(--font-headline)] font-bold text-sm shadow-sm hover:shadow-md transition-all"
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
                    <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-xl">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{comment.user}</span>
                      <span className="text-[10px] text-secondary dark:text-[#8c909f] font-[family-name:var(--font-label)] uppercase font-bold tracking-wider">{comment.time}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-3">{comment.text}</p>
                    <div className="flex gap-6 items-center">
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs font-bold text-primary dark:text-[#adc6ff] hover:underline"
                      >Reply</button>
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${likedComments.has(`${comment.id}`) ? "text-primary dark:text-[#adc6ff]" : "text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff]"}`}
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: likedComments.has(`${comment.id}`) ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                        <span className="font-bold">{comment.likes}</span>
                      </button>
                    </div>

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
                          >Reply</button>
                        </div>
                      </div>
                    )}

                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="mt-8 flex gap-4 pl-6 border-l-2 border-outline-variant/10 dark:border-[#424754]">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#222a3d] flex items-center justify-center shrink-0">
                          {reply.verified ? (
                            <span className="material-symbols-outlined text-blue-700 dark:text-[#adc6ff] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          ) : (
                            <span className="material-symbols-outlined text-secondary text-sm">person</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold text-sm ${reply.verified ? "text-primary dark:text-[#adc6ff]" : "text-on-background dark:text-[#dae2fd]"}`}>{reply.user}</span>
                            <span className="text-[10px] text-secondary dark:text-[#8c909f] font-[family-name:var(--font-label)] uppercase font-bold tracking-wider">{reply.time}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-2">{reply.text}</p>
                          <button
                            onClick={() => handleCommentLike(comment.id, reply.id)}
                            className={`flex items-center gap-1 text-[11px] transition-colors ${likedComments.has(`${comment.id}_${reply.id}`) ? "text-primary dark:text-[#adc6ff]" : "text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff]"}`}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: likedComments.has(`${comment.id}_${reply.id}`) ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                            <span className="font-bold">{reply.likes}</span>
                          </button>
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
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
              <input
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest dark:focus:bg-[#060e20] transition-all placeholder:text-outline/60 dark:placeholder:text-[#8c909f]"
                placeholder="Search blog… (Enter)"
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                onKeyDown={handleSidebarSearch}
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-headline)] text-lg font-bold dark:text-[#dae2fd]">AI Recommended</h2>
                <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-xl">auto_awesome</span>
              </div>
              <ul className="space-y-6">
                {recommendedArticles.map((item) => (
                  <li key={item.id}>
                    <Link className="group block" href={`/article/${item.slug}`}>
                      <p className="text-[10px] font-[family-name:var(--font-label)] uppercase text-slate-400 dark:text-[#8c909f] mb-1">{item.category}</p>
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
              <h2 className="font-[family-name:var(--font-headline)] text-3xl font-extrabold text-on-background dark:text-[#dae2fd] mb-2">Related Courses</h2>
              <p className="text-on-surface-variant dark:text-[#c2c6d6]">Accelerate your career with our industry-leading certification programs.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.title}
                className="bg-surface-container-lowest dark:bg-[#0b1326] rounded-2xl overflow-hidden border border-outline-variant/20 dark:border-[#424754] flex flex-col shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="aspect-video overflow-hidden relative">
                  <Image alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={course.image} fill sizes="33vw" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold mb-3 group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">{course.title}</h3>
                  <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm mb-6 flex-1">{course.desc}</p>
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

export default function ArticlePageWrapper({ post }) {
  return (
    <ToastProvider>
      <ArticleContent post={post} />
    </ToastProvider>
  );
}
