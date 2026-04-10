"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ToastProvider, useToast } from "@/components/Toast";
import CoursesGrid from "@/components/CoursesGrid";
import AskAI from "@/components/AskAI";
import SidebarAuthorSpotlight from "@/components/SidebarAuthorSpotlight";
import SidebarSalaryWidget from "@/components/SidebarSalaryWidget";
import SidebarCourseCard from "@/components/SidebarCourseCard";
import { postCommentAction, fetchCommentsAction, likeCommentAction } from "@/app/actions";
import "@/components/TiptapEditor.css";

// Generate a deterministic background color from a username string
const AVATAR_COLORS = [
  { bg: "#003b93", text: "#ffffff" },
  { bg: "#0e7490", text: "#ffffff" },
  { bg: "#7c3aed", text: "#ffffff" },
  { bg: "#b45309", text: "#ffffff" },
  { bg: "#059669", text: "#ffffff" },
  { bg: "#dc2626", text: "#ffffff" },
  { bg: "#0369a1", text: "#ffffff" },
  { bg: "#9333ea", text: "#ffffff" },
];
function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name = "") {
  return name.split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0, 2) || "?";
}

// Generate contextual AI questions from post domain tags / FAQ headings
function buildSuggestedQuestions(post) {
  // Extract question-headings from post HTML
  const re = /<h[2-4][^>]*>([^<]*\?[^<]*)<\/h[2-4]>/gi;
  const found = [];
  let m;
  while ((m = re.exec(post.content || "")) !== null) {
    const q = m[1].replace(/<[^>]+>/g, "").trim();
    if (q.length > 5) found.push(q);
  }
  if (found.length >= 3) return found.slice(0, 5);

  const tagMap = {
    "Machine Learning":  "What is machine learning?",
    "Deep Learning":     "How do neural networks work?",
    "Transformers":      "Why are Transformers costly?",
    "LLMs":              "What are large language models?",
    "Data Science":      "How to start a data science career?",
    "Python":            "Best Python libraries for ML?",
    "Statistics":        "What statistics do I need for ML?",
    "NLP":               "What is natural language processing?",
    "MLOps":             "What is MLOps?",
    "Generative AI":     "What is generative AI?",
  };
  const fromTags = (post.domain_tags || []).map(t => tagMap[t]).filter(Boolean);
  const fallback = ["I'm a beginner, where to start?", "What skills should I learn first?"];
  return [...found, ...fromTags, ...fallback].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
}

function ArticleContent({ post, recommendedArticles, courseMatch, authorPostCount = 0, sidebarWidgets = [] }) {
  const addToast      = useToast();
  const [progress, setProgress] = useState(0);
  const [toc, setToc]           = useState([]);
  const [activeSection, setActiveSection] = useState("");
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments]   = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentName, setCommentName] = useState("Anonymous");
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [replyingTo, setReplyingTo]   = useState(null);
  const [replyText, setReplyText]     = useState("");
  const [showMobileToc, setShowMobileToc] = useState(false);
  const [likedComments, setLikedComments] = useState(new Set());
  const [showShare, setShowShare] = useState(false);

  const articleRef = useRef(null);
  const headingRefs = useRef({});
  const author = post.author || {};
  const suggestedQuestions = buildSuggestedQuestions(post);

  // Load comments from Supabase
  const loadComments = useCallback(async () => {
    const result = await fetchCommentsAction(post.slug);
    if (result.success) setComments(result.comments);
  }, [post.slug]);

  // Restore local-only state from localStorage + fetch comments from DB
  useEffect(() => {
    setBookmarked(localStorage.getItem(`bookmark_${post.slug}`) === "true");
    const wasLiked = localStorage.getItem(`like_${post.slug}`) === "true";
    setLiked(wasLiked);
    const storedCount = localStorage.getItem(`likeCount_${post.slug}`);
    if (storedCount !== null) setLikeCount(Number(storedCount));
    const storedLiked = localStorage.getItem(`likedComments_${post.slug}`);
    if (storedLiked) { try { setLikedComments(new Set(JSON.parse(storedLiked))); } catch {} }
    loadComments();
  }, [post.slug, loadComments]);

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // TOC generation
  useEffect(() => {
    if (!articleRef.current) return;
    const headings = articleRef.current.querySelectorAll("h2, h3");
    const extracted = [];
    headingRefs.current = {};
    headings.forEach((h, i) => {
      const id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + i;
      h.id = id;
      headingRefs.current[id] = h;
      extracted.push({ id, label: h.textContent.trim(), level: h.tagName.toLowerCase() });
    });
    setToc(extracted);
    if (extracted.length > 0) setActiveSection(extracted[0].id);
  }, [post.content]);

  // TOC scroll tracker — highlights the last heading that has passed the navbar line
  useEffect(() => {
    if (toc.length === 0) return;
    const OFFSET = 96; // navbar height + small buffer

    const allIds = [...toc.map((s) => s.id), "discussion"];

    const onScroll = () => {
      let current = allIds[0];
      for (const id of allIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= OFFSET) current = id;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set correct active section on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  // Fade-in
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in-section").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleTocClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSection(id);
    if (showMobileToc) setShowMobileToc(false);
    window.history.pushState(null, "", `${window.location.pathname}#${id}`);

    // Re-query the heading fresh at click time by DOM index.
    // Stored refs can go stale when React re-renders the content IIFE; index-based
    // lookup against the live DOM is always correct.
    requestAnimationFrame(() => {
      const idx = toc.findIndex((t) => t.id === id);
      let target = null;
      if (idx !== -1 && articleRef.current) {
        target = articleRef.current.querySelectorAll("h2, h3")[idx] || null;
      }
      if (!target) target = document.getElementById(id);
      if (!target) return;

      const NAVBAR = 88;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - NAVBAR);
      // Use the two-argument form — widest browser compatibility, no cancellation.
      window.scrollTo(0, top);
    });
  };

  function handleLike() {
    const n = !liked;
    const c = n ? likeCount + 1 : likeCount - 1;
    setLiked(n); setLikeCount(c);
    localStorage.setItem(`like_${post.slug}`, String(n));
    localStorage.setItem(`likeCount_${post.slug}`, String(c));
  }

  function handleBookmark() {
    const n = !bookmarked;
    setBookmarked(n);
    if (n) localStorage.setItem(`bookmark_${post.slug}`, "true");
    else   localStorage.removeItem(`bookmark_${post.slug}`);
    addToast(n ? "Article saved for later!" : "Removed from saved articles", n ? "success" : "info");
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => addToast("Link copied to clipboard!", "success"))
      .catch(() => addToast("Failed to copy link", "error"));
    setShowShare(false);
  }

  function handleQuizSubmit() {
    if (quizAnswer === null) { addToast("Please select an answer.", "error"); return; }
    setQuizSubmitted(true);
    const q = (post.quiz?.questions || [])[activeQuizIndex];
    if (quizAnswer === q?.correctIndex) addToast("Correct! Well done.", "success");
    else addToast("Not quite — try re-reading the section.", "error");
  }

  function handleNextQuestion() {
    const qs = post.quiz?.questions || [];
    if (activeQuizIndex < qs.length - 1) {
      setActiveQuizIndex(activeQuizIndex + 1);
      setQuizAnswer(null);
      setQuizSubmitted(false);
    }
  }

  // Sidebar search removed — use FilterBar on /article page instead

  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) { addToast("Please write something!", "error"); return; }
    const result = await postCommentAction({ postSlug: post.slug, userName: commentName.trim() || "Anonymous", text: newComment });
    if (result.success) {
      setComments([result.comment, ...comments]);
      setNewComment("");
      addToast("Comment posted!", "success");
    } else {
      addToast(result.error || "Failed to post", "error");
    }
  }

  async function handlePostReply(commentId) {
    if (!replyText.trim()) return;
    const result = await postCommentAction({ postSlug: post.slug, userName: commentName.trim() || "Anonymous", text: replyText, parentCommentId: commentId });
    if (result.success) {
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, result.comment] }
          : c
      ));
      setReplyText(""); setReplyingTo(null);
      addToast("Reply posted!", "success");
    } else {
      addToast(result.error || "Failed to reply", "error");
    }
  }

  async function handleCommentLike(commentId, replyId = null) {
    const targetId = replyId || commentId;
    const key = replyId ? `${commentId}_${replyId}` : `${commentId}`;
    const already = likedComments.has(key);
    const delta = already ? -1 : 1;
    const next = new Set(likedComments);
    already ? next.delete(key) : next.add(key);
    setLikedComments(next);
    localStorage.setItem(`likedComments_${post.slug}`, JSON.stringify([...next]));
    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (replyId && c.id === commentId)
        return { ...c, replies: c.replies.map(r => r.id === replyId ? { ...r, likes: Math.max(0, r.likes + delta) } : r) };
      if (!replyId && c.id === commentId) return { ...c, likes: Math.max(0, c.likes + delta) };
      return c;
    }));
    // Persist to DB
    await likeCommentAction(targetId, delta);
  }

  const likeDisplay = likeCount >= 1000 ? (likeCount / 1000).toFixed(1) + "k" : likeCount;
  const totalComments = comments.length + comments.reduce((a, c) => a + c.replies.length, 0);

  // TOC entries including fixed items
  const tocItems = toc.length > 0 ? toc : [
    { id: "discussion", label: "Discussion", level: "h2" },
  ];
  const tocWithDiscussion = [...tocItems, { id: "discussion", label: "Discussion", level: "h2" }];

  return (
    <>
      <Navbar activeCategory={post.category} />

      {/* Reading Progress */}
      <div className="fixed top-16 left-0 w-full z-40 h-0.5 bg-outline-variant/20 dark:bg-[#222a3d]">
        <div className="h-full bg-primary dark:bg-[#adc6ff] transition-all duration-75"
          style={{ width: `${progress}%` }} />
      </div>

      {/* ── 3-col layout ─────────────────────────────────────── */}
      <div className="pt-20 pb-12 w-full max-w-[1400px] mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_240px] xl:grid-cols-[260px_minmax(0,1fr)_260px] gap-8 xl:gap-12">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-0">
          <div className="sticky top-24 flex flex-col gap-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl max-h-[calc(100vh-8rem)]"
            style={{ background: "linear-gradient(180deg, #003369 38%, #001f4d 100%)" }}>

            {/* TOC */}
            {tocItems.length > 0 && (
              <>
                <nav className="p-6 flex flex-col gap-1 overflow-y-auto min-h-0">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">
                    In this article
                  </h4>
                  {tocWithDiscussion.map((s, i) => (
                    <a key={s.id + i} href={`#${s.id}`}
                      onClick={(e) => handleTocClick(e, s.id)}
                      className={`py-1.5 pl-3 border-l-2 text-[13px] transition-colors ${
                        activeSection === s.id
                          ? "border-white text-white font-bold"
                          : "border-white/10 text-blue-100/60 hover:text-white"
                      } ${s.level === "h3" ? "pl-6 text-xs" : ""}`}>
                      {s.label}
                    </a>
                  ))}
                </nav>
                <div className="mx-6 border-t border-white/20" />
              </>
            )}

            {/* Author Card */}
            <div className="p-6 flex flex-col gap-4">
              {/* Avatar */}
              <div className="flex items-center gap-3">
                {author.image ? (
                  <Image alt={author.name || "Author"} src={author.image} width={40} height={40}
                    className="w-10 h-10 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/90 font-bold text-sm shadow-sm">
                    {author.initials || "?"}
                  </div>
                )}
                <div>
                  <h3 className="font-[family-name:var(--font-headline)] font-semibold text-sm text-white/95 tracking-wide">
                    {author.name || "Author"}
                  </h3>
                  <p className="text-[10px] text-blue-100/70 mt-0.5">
                    {author.expertise?.[0] || "Contributor"} · AnalytixLabs
                  </p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-[13px] text-white/90 leading-relaxed font-medium">
                {author.bio || ""}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-blue-100/70">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-white">{authorPostCount}</span> articles
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1">
                  <span className="font-bold text-white">{author.experience?.replace(" Years", "") || "10"}</span> yrs exp
                </span>
              </div>

              {/* LinkedIn */}
              {author.linkedin && (
                <a href={author.linkedin} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-[#27416C] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* ── Article Canvas ── */}
        <main className="w-full min-w-0">

          {/* ── Article Header ── */}
          <header className="mb-10">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {post.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border border-green-500/60 text-green-700 dark:text-green-400 dark:border-green-500/40 bg-green-50 dark:bg-green-900/20">
                  {post.category}
                </span>
              )}
              {post.skill_level && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border border-outline-variant/30 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] bg-surface-container dark:bg-[#131b2e]">
                  {post.skill_level}
                </span>
              )}
            </div>

            <h1 className="font-[family-name:var(--font-headline)] font-extrabold text-4xl md:text-5xl text-on-background dark:text-[#dae2fd] leading-[1.08] tracking-tight mb-6">
              {post.title}
            </h1>

            {/* Mobile TOC */}
            {tocItems.length > 0 && (
              <div className="lg:hidden mb-4">
                <button onClick={() => setShowMobileToc(!showMobileToc)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] rounded-xl text-sm font-semibold dark:text-[#dae2fd] w-full justify-between">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-sm">list</span>
                    Contents ({tocItems.length} sections)
                  </span>
                  <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6] text-sm transition-transform"
                    style={{ transform: showMobileToc ? "rotate(180deg)" : "none" }}>
                    expand_more
                  </span>
                </button>
                {showMobileToc && (
                  <nav className="mt-2 p-4 bg-surface-container-low dark:bg-[#131b2e] border border-outline-variant/20 dark:border-[#424754] rounded-xl flex flex-col gap-2">
                    {tocWithDiscussion.map((s, i) => (
                      <a key={s.id + i} href={`#${s.id}`}
                        onClick={(e) => handleTocClick(e, s.id)}
                        className={`block py-3 px-4 rounded-xl text-sm transition-all ${
                          activeSection === s.id
                            ? "bg-primary text-white font-bold shadow-lg"
                            : "bg-surface-container-high dark:bg-[#171f33] text-on-surface-variant dark:text-[#c2c6d6]"
                        }`}>
                        {s.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-on-surface-variant dark:text-[#8c909f] mb-6">
              {post.publishedAt && <span>Published {post.publishedAt}</span>}
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <><span className="opacity-30">·</span><span>Updated {post.updatedAt}</span></>
              )}
              {post.readTime && <><span className="opacity-30">·</span><span>{post.readTime}</span></>}
              {post.skill_level && <><span className="opacity-30">·</span><span>{post.skill_level}</span></>}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 flex-wrap pb-6 border-b border-outline-variant/10 dark:border-[#424754]">
              {/* Like */}
              <button onClick={handleLike}
                className={`like-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
                  liked
                    ? "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-surface-variant dark:text-[#c2c6d6] hover:border-red-300"
                }`}>
                <span className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0", color: liked ? "#ef4444" : "inherit" }}>favorite</span>
                {likeDisplay}
              </button>

              {/* Comments */}
              <a href="#discussion"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/40 transition-colors">
                <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                {totalComments}
              </a>

              {/* Share */}
              <div className="relative">
                <button onClick={() => setShowShare(s => !s)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share
                </button>
                {showShare && (
                  <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-[#171f33] border border-outline-variant/20 dark:border-[#424754] rounded-xl shadow-xl z-20 overflow-hidden">
                    <button onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd]">
                      <span className="material-symbols-outlined text-base">link</span>Copy Link
                    </button>
                    <button onClick={() => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank"); setShowShare(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm border-t border-outline-variant/10 dark:border-[#424754] hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd]">
                      <span className="material-symbols-outlined text-base">share_reviews</span>LinkedIn
                    </button>
                    <button onClick={() => { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, "_blank"); setShowShare(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm border-t border-outline-variant/10 dark:border-[#424754] hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd]">
                      <span className="material-symbols-outlined text-base">post_add</span>Twitter / X
                    </button>
                  </div>
                )}
              </div>

              {/* Save */}
              <button onClick={handleBookmark}
                className={`bookmark-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-all ml-auto ${
                  bookmarked
                    ? "border-primary dark:border-[#adc6ff] bg-primary/8 dark:bg-[#adc6ff]/10 text-primary dark:text-[#adc6ff]"
                    : "border-outline-variant/30 dark:border-[#424754] bg-white dark:bg-[#131b2e] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/40"
                }`}>
                <span className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                {bookmarked ? "Saved" : "Save"}
              </button>
            </div>
          </header>

          {/* ── Article Body ── */}
          <article className="prose max-w-none min-w-0" ref={articleRef}>
            {(() => {
              const content = post.content || "";
              if (!content.startsWith("<")) {
                return <p className="text-xl font-medium text-on-surface dark:text-[#dae2fd] leading-relaxed mb-10">{post.excerpt}</p>;
              }

              // Widgets mapping
              const WIDGETS = {
                "[[newsletter]]": "newsletter",
                "[[quiz]]":       "quiz",
                "[[nextsteps]]":   "nextsteps",
                "[[coursematch]]": "coursematch"
              };

              const used = new Set();
              const parts = content.split(/(\[\[newsletter\]\]|\[\[quiz\]\]|\[\[nextsteps\]\]|\[\[coursematch\]\])/gi);

              // Helper to render specific widget
              const renderWidget = (type) => {
                if (type === "newsletter") return (
                  <div key="newsletter-widget" className="my-10 rounded-2xl overflow-hidden border border-slate-200"
                    style={{ background: "#f8fafc" }}>
                    <div className="p-7">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-xl">download</span>
                        <h4 className="font-[family-name:var(--font-headline)] font-bold text-lg text-slate-900">
                          Free Resource: {post.domain_tags?.[0] || "Data Science"} Career Roadmap PDF
                        </h4>
                      </div>
                      <p className="text-slate-600 text-sm mb-5">
                        Get our 2026 edition — covering top roles, skills, salaries, and learning paths. Trusted by 80,000+ learners.
                      </p>
                      <form className="flex flex-col sm:flex-row gap-3" onSubmit={async (e) => {
                          e.preventDefault();
                          const fd = new FormData(e.target);
                          const name = fd.get("name")?.toString().trim();
                          const email = fd.get("email")?.toString().trim();
                          if (!email || !email.includes("@")) { addToast("Please enter a valid email", "error"); return; }
                          const { subscribeAction } = await import("@/app/actions");
                          const result = await subscribeAction({ email, name, source: "article-pdf" });
                          if (result.success) { addToast("Roadmap PDF sent to your email!", "success"); e.target.reset(); }
                          else addToast(result.error || "Failed to subscribe", "error");
                        }}>
                        <input type="text" name="name" placeholder="Your name"
                          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 bg-white text-slate-900" />
                        <input type="email" name="email" placeholder="Enter your work email"
                          className="flex-[2] px-4 py-2.5 rounded-xl text-sm outline-none border border-slate-200 bg-white text-slate-900" />
                        <button type="submit"
                          className="bg-primary text-white hover:bg-primary/90 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap shadow-sm transition-all">
                          Get Free PDF →
                        </button>
                      </form>
                    </div>
                  </div>
                );

                if (type === "quiz" && post.quiz?.questions?.length > 0) {
                  const qs = post.quiz.questions;
                  const q  = qs[activeQuizIndex];
                  return (
                    <div key="quiz-widget" className="my-10 rounded-2xl border border-outline-variant/20 dark:border-[#424754] overflow-hidden">
                      <div className="px-6 py-3 flex items-center gap-2"
                        style={{ background: "rgba(0,59,147,0.06)" }}>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
                          style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Knowledge Check
                        </span>
                        <span className="text-xs font-[family-name:var(--font-label)] font-bold text-on-surface-variant dark:text-[#8c909f] uppercase tracking-wider ml-auto">
                          {activeQuizIndex + 1} / {qs.length}
                        </span>
                      </div>
                      <div className="p-6 bg-surface-container-lowest dark:bg-[#060e20]">
                        <p className="text-on-surface dark:text-[#dae2fd] font-medium mb-5 leading-relaxed">{q.question}</p>
                        <div className="space-y-3 mb-5">
                          {q.options.map((opt, idx) => (
                            <button key={idx}
                              onClick={() => !quizSubmitted && setQuizAnswer(idx)}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                                quizSubmitted
                                  ? idx === q.correctIndex
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300 font-semibold"
                                    : idx === quizAnswer
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 opacity-70"
                                    : "bg-surface-container dark:bg-[#131b2e] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] opacity-40"
                                  : quizAnswer === idx
                                  ? "bg-primary/10 dark:bg-[#adc6ff]/10 border-primary dark:border-[#adc6ff] text-on-surface dark:text-[#dae2fd]"
                                  : "bg-surface-container dark:bg-[#131b2e] border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/50 cursor-pointer"
                              }`}>
                              <span className="font-bold mr-2 text-primary dark:text-[#adc6ff]">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                            </button>
                          ))}
                        </div>
                        {!quizSubmitted ? (
                          <button onClick={handleQuizSubmit}
                            className="px-6 py-2.5 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90"
                            style={{ background: "#16a34a" }}>
                            Submit Answer
                          </button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-4">
                            <span className={`flex items-center gap-1.5 text-sm font-bold ${quizAnswer === q.correctIndex ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {quizAnswer === q.correctIndex ? "check_circle" : "cancel"}
                              </span>
                              {quizAnswer === q.correctIndex ? "Correct! Keep learning." : `Correct: ${q.options[q.correctIndex]}`}
                            </span>
                            {activeQuizIndex < qs.length - 1 && (
                              <button onClick={handleNextQuestion}
                                className="flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                                Next Question <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (type === "nextsteps") return (
                  <div key="nextsteps-widget" className="my-10 rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                    style={{ background: "#f8fafc" }}>
                    <div className="px-6 py-4 border-b border-slate-200"
                      style={{ background: "linear-gradient(90deg,rgba(0,59,147,0.03) 0%,transparent 100%)" }}>
                      <h3 className="font-[family-name:var(--font-headline)] font-bold text-base flex items-center gap-2 text-slate-900">
                        <span className="text-amber-500">✦</span>
                        AI-Powered Next Steps
                      </h3>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Great progress on {post.domain_tags?.[0] || "this topic"}! Based on your reading, what would you like to do next?
                      </p>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-3">
                      {[
                        { icon: "quiz",         label: "Take a quick quiz",           href: "#discussion" },
                        { icon: "download",     label: "Download PDF Guide",          href: "#newsletter" },
                        { icon: "school",       label: `View ${post.domain_tags?.[0] || "AI"} Curriculum`, href: "https://www.analytixlabs.co.in/courses" },
                        { icon: "group",        label: "Join Study Community",        href: "https://www.analytixlabs.co.in/community" },
                      ].map(({ icon, label, href }) => (
                        <a key={label} href={href}
                          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all bg-white border-slate-200 text-slate-700 hover:border-primary/30 hover:text-primary hover:-translate-y-0.5 shadow-sm">
                          <span className="material-symbols-outlined text-base text-slate-400">{icon}</span>
                          <span className="leading-snug">{label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );

                if (type === "coursematch" && courseMatch) return (
                  <div key="course-widget" className="my-10 rounded-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 shadow-sm"
                    style={{ background: "#f8fafc" }}>
                    <div className="flex-1 p-7 flex flex-col gap-3">
                      <p className="text-primary text-xs font-bold uppercase tracking-wider">Reading about {post.domain_tags?.[0] || "AI"}?</p>
                      <h3 className="font-[family-name:var(--font-headline)] font-bold text-xl text-slate-900 leading-tight">
                        {courseMatch.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{courseMatch.desc}</p>
                      <button className="bg-primary text-white hover:bg-primary/90 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all mt-2">
                        View Full Course Details →
                      </button>
                    </div>
                    {courseMatch.image && (
                      <div className="w-full md:w-48 aspect-video md:aspect-auto relative overflow-hidden">
                        <Image src={courseMatch.image} alt={courseMatch.title} fill className="object-cover opacity-70" />
                      </div>
                    )}
                  </div>
                );

                return null;
              };

              const renderedElements = parts.map((part, idx) => {
                const lowerPart = part.toLowerCase();
                if (WIDGETS[lowerPart]) {
                  used.add(WIDGETS[lowerPart]);
                  return renderWidget(WIDGETS[lowerPart]);
                }
                return <div key={idx} className="tiptap-prose" dangerouslySetInnerHTML={{ __html: part }} />;
              });

              // Fallback: Append unused widgets to the end
              const fallbacks = [];
              if (!used.has("newsletter")) fallbacks.push(renderWidget("newsletter"));
              if (!used.has("quiz"))       fallbacks.push(renderWidget("quiz"));
              if (!used.has("nextsteps"))  fallbacks.push(renderWidget("nextsteps"));
              if (!used.has("coursematch")) fallbacks.push(renderWidget("coursematch"));

              return [...renderedElements, ...fallbacks];
            })()}
          </article>

          {/* ── Discussion ── */}
          <section id="discussion" className="mt-20 pt-10 border-t border-outline-variant/20 dark:border-[#424754]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-[family-name:var(--font-headline)] text-2xl font-extrabold text-on-background dark:text-[#dae2fd]">
                Discussion
              </h2>
              <span className="text-sm font-bold text-on-surface-variant dark:text-[#c2c6d6]">
                {totalComments} Comments
              </span>
            </div>

            {/* New comment */}
            <form onSubmit={handlePostComment}
              className="mb-10 flex gap-3 p-5 bg-surface-container-low dark:bg-[#131b2e] rounded-2xl border border-outline-variant/10 dark:border-[#424754]">
              <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-[#2d3449] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary dark:text-[#c2c6d6]">person</span>
              </div>
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <input
                  type="text"
                  className="w-full p-3 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline/60 dark:placeholder:text-slate-500 outline-none"
                  placeholder="Your name (optional)"
                  value={commentName === "Anonymous" ? "" : commentName}
                  onChange={e => setCommentName(e.target.value || "Anonymous")}
                />
                <textarea
                  className="w-full p-4 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline/60 dark:placeholder:text-slate-500 resize-none outline-none"
                  placeholder="Ask a question or share your thoughts..."
                  rows="3" value={newComment} onChange={e => setNewComment(e.target.value)} />
                <div className="flex justify-end">
                  <button type="submit"
                    className="glass-chip active px-6 py-2.5 rounded-full font-bold text-sm">
                    Post Comment
                  </button>
                </div>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-8">
              {comments.map(comment => {
                const avatarColor = getAvatarColor(comment.user);
                return (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: avatarColor.bg, color: avatarColor.text }}>
                    {getInitials(comment.user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{comment.user}</span>
                      <span className="text-[11px] text-secondary dark:text-[#8c909f] uppercase font-bold tracking-wider">{comment.time}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-2">{comment.text}</p>
                    <div className="flex gap-5 items-center">
                      <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs font-bold text-primary dark:text-[#adc6ff] hover:underline">Reply</button>
                      <button onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${likedComments.has(`${comment.id}`) ? "text-primary dark:text-[#adc6ff]" : "text-secondary dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff]"}`}>
                        <span className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: likedComments.has(`${comment.id}`) ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                        <span className="font-bold">{comment.likes}</span>
                      </button>
                    </div>

                    {replyingTo === comment.id && (
                      <div className="reply-form show mt-4">
                        <div className="flex gap-2">
                          <input className="flex-1 p-3 bg-surface-container-lowest dark:bg-[#060e20] dark:text-[#dae2fd] border border-outline-variant/30 dark:border-[#424754] rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Write a reply..."
                            value={replyText} onChange={e => setReplyText(e.target.value)} />
                          <button onClick={() => handlePostReply(comment.id)}
                            className="px-5 py-2 bg-primary text-on-primary rounded-full font-bold text-sm whitespace-nowrap">
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {comment.replies?.map(reply => {
                      const replyColor = getAvatarColor(reply.user);
                      return (
                      <div key={reply.id} className="mt-6 flex gap-3 pl-5 border-l-2 border-outline-variant/10 dark:border-[#424754]">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                          style={{ background: replyColor.bg, color: replyColor.text }}>
                          {getInitials(reply.user)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-on-background dark:text-[#dae2fd]">{reply.user}</span>
                            <span className="text-[11px] text-secondary dark:text-[#8c909f] uppercase font-bold tracking-wider">{reply.time}</span>
                          </div>
                          <p className="text-sm text-on-surface-variant dark:text-[#c2c6d6] leading-relaxed mb-2">{reply.text}</p>
                          <button onClick={() => handleCommentLike(comment.id, reply.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${likedComments.has(`${comment.id}_${reply.id}`) ? "text-primary dark:text-[#adc6ff]" : "text-secondary dark:text-[#c2c6d6] hover:text-primary"}`}>
                            <span className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: likedComments.has(`${comment.id}_${reply.id}`) ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                            <span className="font-bold">{reply.likes}</span>
                          </button>
                        </div>
                      </div>
                    ); })}
                  </div>
                </div>
              ); })}
            </div>
          </section>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-5">
          <div className="sticky top-24 flex flex-col gap-5">
            {sidebarWidgets.filter(w => w.enabled).map(widget => {
              switch (widget.type) {

                case 'ask_ai':
                  return (
                    <AskAI
                      key={widget.id}
                      questions={suggestedQuestions}
                      context={`Title: ${post.title}\nExcerpt: ${post.excerpt || ""}\nTopics: ${(post.domain_tags || []).join(", ")}`}
                      placeholder="Ask anything about this article…"
                    />
                  );

                case 'recommended_posts':
                  return recommendedArticles?.length > 0 ? (
                    <div key={widget.id} className="rounded-2xl border p-5 bg-surface-container-lowest dark:bg-[#0b1326] border-outline-variant/20 dark:border-[#424754]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-[family-name:var(--font-headline)] font-bold text-base dark:text-[#dae2fd]">Recommended</h3>
                        <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <ul className="flex flex-col gap-4">
                        {recommendedArticles.slice(0, widget.config?.count ?? 3).map(item => (
                          <li key={item.id}>
                            <Link href={`/article/${item.slug}`} className="group block">
                              <p className="text-[10px] font-[family-name:var(--font-label)] uppercase text-on-surface-variant dark:text-[#8c909f] mb-0.5">{item.category}</p>
                              <h5 className="text-[13px] font-bold leading-snug group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd]">
                                {item.title}
                              </h5>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null;

                case 'author_spotlight':
                  return (
                    <SidebarAuthorSpotlight
                      key={widget.id}
                      author={post.author}
                      articleCount={authorPostCount}
                    />
                  );

                case 'salary_table':
                  return <SidebarSalaryWidget key={widget.id} config={widget.config} />;

                case 'course_card': {
                  const cfg = widget.config ?? {};
                  const course = cfg.use_article_match && courseMatch
                    ? { ...courseMatch, ctaUrl: cfg.cta_url, ctaLabel: cfg.cta_label }
                    : { title: cfg.fallback_title, duration: cfg.fallback_duration, rating: cfg.fallback_rating, ctaUrl: cfg.cta_url, ctaLabel: cfg.cta_label };
                  return course?.title ? <SidebarCourseCard key={widget.id} course={course} /> : null;
                }

                default:
                  return null;
              }
            })}
          </div>
        </aside>
      </div>

      {/* ── Related Courses ── */}
      <CoursesGrid showViewAll={false} />

      <Footer />
      <MobileBottomNav activePage="insights" />
    </>
  );
}

export default function ArticlePageWrapper({ post, recommendedArticles, courseMatch, authorPostCount, sidebarWidgets }) {
  return (
    <ToastProvider>
      <ArticleContent post={post} recommendedArticles={recommendedArticles} courseMatch={courseMatch} authorPostCount={authorPostCount} sidebarWidgets={sidebarWidgets} />
    </ToastProvider>
  );
}
