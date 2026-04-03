"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { publishPostAction, schedulePostAction, updatePostAction, deletePostAction } from "@/app/actions";
import TiptapEditor from "@/components/TiptapEditor";
import { authors } from "@/lib/data";
import "./studio.css";

const DRAFT_KEY = "alabs_studio_draft";
const CATEGORIES = ["Machine Learning", "Data Science", "Engineering", "Career Growth"];
const COURSES = [
  { id: "ml-fundamentals", name: "ML Fundamentals" },
  { id: "data-science-bootcamp", name: "Data Science Bootcamp" },
  { id: "python-for-data", name: "Python for Data" },
  { id: "deep-learning-pro", name: "Deep Learning Pro" },
  { id: "sql-analytics", name: "SQL & Analytics" },
];
const LEAD_MAGNETS = [
  { id: "none", name: "None" },
  { id: "ml-cheatsheet", name: "ML Cheatsheet PDF" },
  { id: "sql-guide", name: "SQL Quick Guide" },
  { id: "career-roadmap", name: "Career Roadmap PDF" },
  { id: "python-snippets", name: "Python Snippets PDF" },
];
const SCHEMA_TYPES = ["Article", "BlogPosting", "TechArticle", "HowTo", "FAQPage"];

// ── Reusable Toggle ───────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}

// ── Collapsible Section Header ────────────────────────────────
function SectionHeader({ title, dotColor, tier, open, onToggle }) {
  const tierStyle = tier === "T1"
    ? { bg: "var(--accent-dim)", color: "var(--accent)", border: "rgba(0,59,147,0.2)" }
    : tier === "T2"
    ? { bg: "var(--orange-dim)", color: "var(--orange)", border: "rgba(225,114,14,0.2)" }
    : { bg: "var(--bg4)", color: "var(--text3)", border: "var(--border2)" };

  return (
    <div className="pp-header" onClick={onToggle}>
      <div className="pp-title">
        <span className="dot" style={{ background: dotColor || "var(--accent)" }} />
        {title}
        {tier && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
            background: tierStyle.bg, color: tierStyle.color,
            border: `1px solid ${tierStyle.border}`,
          }}>{tier}</span>
        )}
      </div>
      <span className={`pp-chevron ${open ? "open" : ""}`}>▾</span>
    </div>
  );
}

export default function AuthorStudio() {
  const router = useRouter();

  // ── Content state ─────────────────────────────────────────
  const [postBody, setPostBody] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [readTime, setReadTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [excerpt, setExcerpt] = useState("");

  // ── Core metadata ─────────────────────────────────────────
  const [category, setCategory] = useState("Machine Learning");
  const [authorId, setAuthorId] = useState("al-editorial");
  const [skill, setSkill] = useState("Beginner");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── SEO Settings ──────────────────────────────────────────
  const [focusKeyword, setFocusKeyword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [schemaType, setSchemaType] = useState("Article");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // ── Course Mapping ────────────────────────────────────────
  const [mappedCourses, setMappedCourses] = useState([]);
  const [courseCTA, setCourseCTA] = useState("");

  // ── Lead Magnet & CTA ─────────────────────────────────────
  const [newsletterPlacement, setNewsletterPlacement] = useState("after-intro");
  const [leadMagnetPDF, setLeadMagnetPDF] = useState("none");
  const [exitIntentEnabled, setExitIntentEnabled] = useState(false);

  // ── Quiz Builder ──────────────────────────────────────────
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [ga4TrackingEnabled, setGa4TrackingEnabled] = useState(true);

  // ── AI Recommendation Hints ───────────────────────────────
  const [entityTags, setEntityTags] = useState([]);
  const [entityTagInput, setEntityTagInput] = useState("");
  const [relatedPostIds, setRelatedPostIds] = useState("");
  const [aiInclusionEnabled, setAiInclusionEnabled] = useState(true);

  // ── Author & Trust Signals ────────────────────────────────
  const [authorBio, setAuthorBio] = useState("");
  const [factChecker, setFactChecker] = useState("");
  const [lastReviewedDate, setLastReviewedDate] = useState("");

  // ── Discussion Settings ───────────────────────────────────
  const [qaEnabled, setQaEnabled] = useState(false);
  const [faqSchemaEnabled, setFaqSchemaEnabled] = useState(false);
  const [moderationMode, setModerationMode] = useState("auto");

  // ── Advanced / Accessibility ──────────────────────────────
  const [semanticIndexEnabled, setSemanticIndexEnabled] = useState(true);
  const [salaryHubEnabled, setSalaryHubEnabled] = useState(false);
  const [darkModeCompat, setDarkModeCompat] = useState(true);
  const [progressBarColor, setProgressBarColor] = useState("#003b93");

  // ── UI state ──────────────────────────────────────────────
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Draft");
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [viewMode, setViewMode] = useState("write");
  const [editorKey, setEditorKey] = useState(0);
  const [editorInitContent, setEditorInitContent] = useState("<h1></h1><p></p>");
  const [editingPostId, setEditingPostId] = useState(null); // null = new post, number = editing existing
  const [postsViewMode, setPostsViewMode] = useState("editor"); // "editor" | "posts"
  const [allPosts, setAllPosts] = useState([]);

  // ── Section collapse state ────────────────────────────────
  const [openSections, setOpenSections] = useState({
    core: true, taxonomy: true, seo: false,
    courses: false, leadmagnet: false, quiz: false,
    ai: false, author: false, discussion: false, advanced: false,
  });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const fileInputRef = useRef(null);
  const draftTimerRef = useRef(null);
  const authorObj = authors[authorId] || authors["al-editorial"];

  // ── SEO score ─────────────────────────────────────────────
  const kw = focusKeyword.toLowerCase().trim();
  const effectiveDesc = metaDesc || excerpt;
  const seoChecks = [
    { label: "Focus keyword set", pass: kw.length > 0 },
    { label: "Keyword in title", pass: !!(kw && postTitle.toLowerCase().includes(kw)), warn: !kw && !!postTitle },
    { label: "Description length (120–160)", pass: effectiveDesc.length >= 120 && effectiveDesc.length <= 160, warn: effectiveDesc.length > 0 && effectiveDesc.length < 120 },
    { label: "Keyword in description", pass: !!(kw && effectiveDesc.toLowerCase().includes(kw)), warn: !kw && !!effectiveDesc },
    { label: "Featured image set", pass: !!featuredImage },
    { label: "Title length (50–60 chars)", pass: postTitle.length >= 50 && postTitle.length <= 60, warn: postTitle.length > 0 && postTitle.length < 50 },
    { label: "Keyword in URL slug", pass: !!(kw && slug.includes(kw.replace(/\s+/g, "-"))), warn: !kw && !!slug },
  ];
  const seoScore = Math.round((seoChecks.filter(c => c.pass).length / seoChecks.length) * 100);
  const seoGrade = seoScore >= 80 ? "Good" : seoScore >= 50 ? "Needs work" : "Poor";
  const seoColor = seoScore >= 80 ? "var(--green)" : seoScore >= 50 ? "var(--orange)" : "var(--red)";
  const circumference = 2 * Math.PI * 16;
  const seoArc = (seoScore / 100) * circumference;

  // ── On mount: check for saved draft ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.postBody) { setDraftData(draft); setShowDraftBanner(true); }
      } catch {}
    }
  }, []);

  // ── Auto-save (debounced 1.5s) ────────────────────────────
  useEffect(() => {
    if (!postBody && !postTitle) return;
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = {
        postBody, postTitle, slug, excerpt,
        category, authorId, skill, tags, featuredImage,
        focusKeyword, metaTitle, metaDesc, ogImage, schemaType, canonicalUrl,
        mappedCourses, courseCTA, newsletterPlacement, leadMagnetPDF, exitIntentEnabled,
        quizQuestions, ga4TrackingEnabled,
        entityTags, relatedPostIds, aiInclusionEnabled,
        authorBio, factChecker, lastReviewedDate,
        qaEnabled, faqSchemaEnabled, moderationMode,
        semanticIndexEnabled, salaryHubEnabled, darkModeCompat, progressBarColor,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSaveStatus(`Saved draft · ${t}`);
    }, 1500);
    return () => clearTimeout(draftTimerRef.current);
  }, [
    postBody, postTitle, slug, excerpt, category, authorId, skill, tags, featuredImage,
    focusKeyword, metaTitle, metaDesc, ogImage, schemaType, canonicalUrl,
    mappedCourses, courseCTA, newsletterPlacement, leadMagnetPDF, exitIntentEnabled,
    quizQuestions, ga4TrackingEnabled, entityTags, relatedPostIds, aiInclusionEnabled,
    authorBio, factChecker, lastReviewedDate, qaEnabled, faqSchemaEnabled, moderationMode,
    semanticIndexEnabled, salaryHubEnabled, darkModeCompat, progressBarColor,
  ]);

  // ── Restore draft ─────────────────────────────────────────
  const restoreDraft = () => {
    if (!draftData) return;
    setPostBody(draftData.postBody || "");
    setPostTitle(draftData.postTitle || "");
    setSlug(draftData.slug || "");
    setExcerpt(draftData.excerpt || "");
    setCategory(draftData.category || "Machine Learning");
    setAuthorId(draftData.authorId || "al-editorial");
    setSkill(draftData.skill || "Beginner");
    setTags(draftData.tags || []);
    setFeaturedImage(draftData.featuredImage || "");
    setFocusKeyword(draftData.focusKeyword || "");
    setMetaTitle(draftData.metaTitle || "");
    setMetaDesc(draftData.metaDesc || "");
    setOgImage(draftData.ogImage || "");
    setSchemaType(draftData.schemaType || "Article");
    setCanonicalUrl(draftData.canonicalUrl || "");
    setMappedCourses(draftData.mappedCourses || []);
    setCourseCTA(draftData.courseCTA || "");
    setNewsletterPlacement(draftData.newsletterPlacement || "after-intro");
    setLeadMagnetPDF(draftData.leadMagnetPDF || "none");
    setExitIntentEnabled(draftData.exitIntentEnabled || false);
    setQuizQuestions(draftData.quizQuestions || []);
    setGa4TrackingEnabled(draftData.ga4TrackingEnabled !== false);
    setEntityTags(draftData.entityTags || []);
    setRelatedPostIds(draftData.relatedPostIds || "");
    setAiInclusionEnabled(draftData.aiInclusionEnabled !== false);
    setAuthorBio(draftData.authorBio || "");
    setFactChecker(draftData.factChecker || "");
    setLastReviewedDate(draftData.lastReviewedDate || "");
    setQaEnabled(draftData.qaEnabled || false);
    setFaqSchemaEnabled(draftData.faqSchemaEnabled || false);
    setModerationMode(draftData.moderationMode || "auto");
    setSemanticIndexEnabled(draftData.semanticIndexEnabled !== false);
    setSalaryHubEnabled(draftData.salaryHubEnabled || false);
    setDarkModeCompat(draftData.darkModeCompat !== false);
    setProgressBarColor(draftData.progressBarColor || "#003b93");
    setEditorInitContent(draftData.postBody || "<h1></h1><p></p>");
    setEditorKey(k => k + 1);
    setShowDraftBanner(false);
    const t = draftData.savedAt
      ? new Date(draftData.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    setSaveStatus(`Restored draft${t ? " · " + t : ""}`);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftData(null);
    setShowDraftBanner(false);
  };

  // ── Editor change handler ─────────────────────────────────
  const handleBodyChange = (html) => {
    setPostBody(html);
    if (typeof window !== "undefined") {
      const dummy = document.createElement("div");
      dummy.innerHTML = html;
      const h1 = dummy.querySelector("h1");
      const title = h1 ? h1.textContent.trim() : "";
      setPostTitle(title);
      const newSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      setSlug(newSlug);
      if (h1) dummy.removeChild(h1);
      const text = dummy.textContent || "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.round(words / 225));
      setWordCount(words);
      setReadTime(mins);
      setExcerpt(prev => {
        const autoExcerpt = text.substring(0, 155) + (text.length > 155 ? "..." : "");
        return prev && !prev.endsWith("...") ? prev : autoExcerpt;
      });
    }
    setSaveStatus("Unsaved");
  };

  // ── Tags ──────────────────────────────────────────────────
  const addTag = (val) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (trimmed && !tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);
    setTagInput("");
  };
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags(tags.slice(0, -1));
  };

  // ── Entity tags ───────────────────────────────────────────
  const addEntityTag = (val) => {
    const trimmed = val.trim().replace(/,/g, "");
    if (trimmed && !entityTags.includes(trimmed)) setEntityTags(prev => [...prev, trimmed]);
    setEntityTagInput("");
  };
  const handleEntityTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEntityTag(entityTagInput); }
    else if (e.key === "Backspace" && !entityTagInput && entityTags.length > 0) setEntityTags(entityTags.slice(0, -1));
  };

  // ── Image upload ──────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setFeaturedImage(data.url);
      else alert("Upload failed: " + (data.error || "unknown error"));
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  // ── Course toggle ─────────────────────────────────────────
  const toggleCourse = (id) => {
    setMappedCourses(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // ── Quiz helpers ──────────────────────────────────────────
  const addQuizQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      { id: Date.now(), question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };
  const updateQuizQuestion = (id, field, value) => {
    setQuizQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };
  const updateQuizOption = (qId, optIdx, value) => {
    setQuizQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, options: q.options.map((o, i) => i === optIdx ? value : o) } : q
    ));
  };
  const removeQuizQuestion = (id) => setQuizQuestions(prev => prev.filter(q => q.id !== id));

  // ── Payload builder ───────────────────────────────────────
  const buildPayload = () => ({
    title: postTitle,
    slug: slug || postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
    excerpt,
    content: postBody,
    category,
    domain_tags: tags,
    skill_level: skill,
    readTime: `${readTime} min read`,
    authorId,
    image: featuredImage,
    seo: { focusKeyword, metaTitle: metaTitle || postTitle, metaDesc: metaDesc || excerpt, ogImage: ogImage || featuredImage, schemaType, canonicalUrl },
    courseMappings: mappedCourses,
    courseCTA,
    newsletter: { placement: newsletterPlacement, leadMagnet: leadMagnetPDF, exitIntent: exitIntentEnabled },
    quiz: { questions: quizQuestions, ga4Tracking: ga4TrackingEnabled },
    aiHints: { entityTags, relatedPostIds: relatedPostIds.split(",").map(s => s.trim()).filter(Boolean), enabled: aiInclusionEnabled },
    trust: { authorBio, factChecker, lastReviewedDate },
    discussion: { qa: qaEnabled, faqSchema: faqSchemaEnabled, moderation: moderationMode },
    advanced: { semanticIndex: semanticIndexEnabled, salaryHub: salaryHubEnabled, darkModeCompat, progressBarColor },
  });

  const clearDraftOnSuccess = () => localStorage.removeItem(DRAFT_KEY);

  // ── New Post (reset all state) ────────────────────────────
  const clearEditor = () => {
    if (postBody && !window.confirm("Start a new post? Any unsaved changes will be lost.")) return;
    localStorage.removeItem(DRAFT_KEY);
    setPostBody(""); setPostTitle(""); setSlug(""); setExcerpt("");
    setCategory("Machine Learning"); setAuthorId("al-editorial"); setSkill("Beginner");
    setTags([]); setTagInput(""); setFeaturedImage("");
    setFocusKeyword(""); setMetaTitle(""); setMetaDesc(""); setOgImage("");
    setSchemaType("Article"); setCanonicalUrl("");
    setMappedCourses([]); setCourseCTA("");
    setNewsletterPlacement("after-intro"); setLeadMagnetPDF("none"); setExitIntentEnabled(false);
    setQuizQuestions([]); setGa4TrackingEnabled(true);
    setEntityTags([]); setEntityTagInput(""); setRelatedPostIds(""); setAiInclusionEnabled(true);
    setAuthorBio(""); setFactChecker(""); setLastReviewedDate("");
    setQaEnabled(false); setFaqSchemaEnabled(false); setModerationMode("auto");
    setSemanticIndexEnabled(true); setSalaryHubEnabled(false); setDarkModeCompat(true);
    setProgressBarColor("#003b93");
    setEditorInitContent("<h1></h1><p></p>");
    setEditorKey(k => k + 1);
    setSaveStatus("Draft");
    setWordCount(0); setReadTime(0);
  };

  // ── Delete post ───────────────────────────────────────────
  const handleDeletePost = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const res = await deletePostAction(post.id);
    if (res.success) {
      setAllPosts(prev => prev.filter(p => p.id !== post.id));
      if (editingPostId === post.id) { setEditingPostId(null); clearEditor(); }
    } else {
      alert("Delete failed: " + res.error);
    }
  };

  // ── Load posts list (all statuses, studio-only) ───────────
  const fetchAllPosts = async () => {
    try {
      const res = await fetch('/api/posts?all=true');
      const data = await res.json();
      setAllPosts(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  // Fetch on mount so list is ready when user opens "All Posts"
  useEffect(() => { fetchAllPosts(); }, []);

  // ── Load a post into the editor for editing ───────────────
  const loadPostForEdit = (post) => {
    if (postBody && !window.confirm("Load this post for editing? Unsaved changes will be lost.")) return;
    localStorage.removeItem(DRAFT_KEY);
    setEditingPostId(post.id);
    setPostBody(post.content || "");
    setPostTitle(post.title || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setCategory(post.category || "Machine Learning");
    setAuthorId(post.authorId || "al-editorial");
    setSkill(post.skill_level || "Beginner");
    setTags(post.domain_tags || []);
    setTagInput("");
    setFeaturedImage(post.image || "");
    setFocusKeyword(post.seo?.focusKeyword || "");
    setMetaTitle(post.seo?.metaTitle || "");
    setMetaDesc(post.seo?.metaDesc || "");
    setOgImage(post.seo?.ogImage || "");
    setSchemaType(post.seo?.schemaType || "Article");
    setCanonicalUrl(post.seo?.canonicalUrl || "");
    setMappedCourses(post.courseMappings || []);
    setCourseCTA(post.courseCTA || "");
    setNewsletterPlacement(post.newsletter?.placement || "after-intro");
    setLeadMagnetPDF(post.newsletter?.leadMagnet || "none");
    setExitIntentEnabled(post.newsletter?.exitIntent || false);
    setQuizQuestions(post.quiz?.questions || []);
    setGa4TrackingEnabled(post.quiz?.ga4Tracking !== false);
    setEntityTags(post.aiHints?.entityTags || []);
    setRelatedPostIds((post.aiHints?.relatedPostIds || []).join(", "));
    setAiInclusionEnabled(post.aiHints?.enabled !== false);
    setAuthorBio(post.trust?.authorBio || "");
    setFactChecker(post.trust?.factChecker || "");
    setLastReviewedDate(post.trust?.lastReviewedDate || "");
    setQaEnabled(post.discussion?.qa || false);
    setFaqSchemaEnabled(post.discussion?.faqSchema || false);
    setModerationMode(post.discussion?.moderation || "auto");
    setSemanticIndexEnabled(post.advanced?.semanticIndex !== false);
    setSalaryHubEnabled(post.advanced?.salaryHub || false);
    setDarkModeCompat(post.advanced?.darkModeCompat !== false);
    setProgressBarColor(post.advanced?.progressBarColor || "#003b93");
    setEditorInitContent(post.content || "<h1></h1><p></p>");
    setEditorKey(k => k + 1);
    setSaveStatus(`Editing: ${post.title}`);
    setWordCount(0); setReadTime(0);
    setPostsViewMode("editor");
  };

  // ── Publish ───────────────────────────────────────────────
  const publishPost = async () => {
    if (!postTitle.trim()) { alert("Please add a title to your article before publishing."); return; }
    setIsPublishing(true);
    setSaveStatus("Publishing...");
    try {
      const res = await publishPostAction(buildPayload());
      if (res.success) { setSaveStatus("✓ Published"); clearDraftOnSuccess(); fetchAllPosts(); router.push("/article/" + res.slug); }
      else { alert("Publish failed: " + res.error); setSaveStatus("Error"); }
    } catch { alert("Publish failed. Please try again."); setSaveStatus("Error"); }
    finally { setIsPublishing(false); }
  };

  // ── Update existing post ──────────────────────────────────
  const updatePost = async () => {
    if (!postTitle.trim()) { alert("Please add a title before updating."); return; }
    setIsPublishing(true);
    setSaveStatus("Updating...");
    try {
      const res = await updatePostAction(editingPostId, buildPayload());
      if (res.success) {
        setSaveStatus("✓ Updated");
        clearDraftOnSuccess();
        fetchAllPosts();
        router.push("/article/" + res.slug);
      } else { alert("Update failed: " + res.error); setSaveStatus("Error"); }
    } catch { alert("Update failed. Please try again."); setSaveStatus("Error"); }
    finally { setIsPublishing(false); }
  };

  // ── Schedule ──────────────────────────────────────────────
  const schedulePost = async () => {
    const dt = prompt("Schedule for (e.g. 2026-04-15 10:00 IST):");
    if (!dt) return;
    if (!postTitle.trim()) { alert("Please add a title to your article before scheduling."); return; }
    setIsPublishing(true);
    setSaveStatus("Scheduling...");
    try {
      const res = await schedulePostAction(buildPayload());
      if (res.success) { setSaveStatus(`⏰ Scheduled: ${dt}`); clearDraftOnSuccess(); setTimeout(() => router.push("/"), 1500); }
      else { alert("Schedule failed: " + res.error); setSaveStatus("Error"); }
    } catch { alert("Schedule failed. Please try again."); setSaveStatus("Error"); }
    finally { setIsPublishing(false); }
  };

  const excerptLen = excerpt.length;
  const excerptClass = excerptLen === 0 ? "" : excerptLen < 120 ? "cc-warn" : excerptLen <= 160 ? "cc-good" : "cc-bad";
  const isSaved = saveStatus.startsWith("Saved") || saveStatus.startsWith("Restored");
  const isPublished = saveStatus.includes("Published") || saveStatus.includes("Scheduled");

  return (
    <div className="studio-wrapper">
      <div className="app">

        {/* ── Left icon rail ── */}
        <nav className="sidebar">
          <div className="s-logo" onClick={() => router.push("/")} title="Home" style={{ cursor: "pointer" }}>
            <svg viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M2 9 L9 2 L16 9" /><path d="M4 7v8h4v-4h2v4h4V7" />
            </svg>
          </div>
          <div className={`s-icon ${viewMode === "write" ? "active" : ""}`} title="Write" onClick={() => setViewMode("write")}>
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 14l2-2 8-8 2 2-8 8-2 0 0-2z" /><path d="M11 4l2 2" />
            </svg>
          </div>
          <div className={`s-icon ${viewMode === "preview" ? "active" : ""}`} title="Preview" onClick={() => { setPostsViewMode("editor"); setViewMode("preview"); }}>
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" /><circle cx="9" cy="9" r="2" />
            </svg>
          </div>
          <div className={`s-icon ${postsViewMode === "posts" ? "active" : ""}`} title="All Posts" onClick={() => { setPostsViewMode(p => p === "posts" ? "editor" : "posts"); fetchAllPosts(); }}>
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="2" width="14" height="3" rx="1" /><rect x="2" y="7.5" width="14" height="3" rx="1" /><rect x="2" y="13" width="14" height="3" rx="1" />
            </svg>
          </div>
          <div className="s-spacer" />
          <div className="tb-avatar" title={authorObj.name} style={{ background: "var(--accent)" }}>
            {authorObj.initials}
          </div>
        </nav>

        {/* ── Main area ── */}
        <div className="main">

          {/* ── Top bar ── */}
          <header className="topbar">
            <span className="tb-brand">Analytix<span>Labs</span> Studio</span>
            <button
              onClick={clearEditor}
              title="Start a new post"
              style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              + New Post
            </button>
            <div style={{ display: "flex", gap: 2, background: "var(--bg3)", padding: 2, borderRadius: 8, border: "1px solid var(--border)" }}>
              {["write", "preview"].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: "4px 14px", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 6, cursor: "pointer",
                  background: viewMode === m ? "var(--bg)" : "transparent",
                  color: viewMode === m ? "var(--text)" : "var(--text3)",
                  boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s", textTransform: "capitalize",
                }}>{m}</button>
              ))}
            </div>
            <span
              className={`tb-pill ${isSaved || isPublished ? "saved" : ""}`}
              style={isPublished ? { background: "var(--green-dim)", color: "var(--green)", borderColor: "rgba(0,200,83,0.2)" } : {}}
            >{saveStatus}</span>
            {wordCount > 0 && (
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {wordCount.toLocaleString()} words · {readTime} min
              </span>
            )}
          </header>

          {/* ── Workspace ── */}
          <div className="workspace">

            {/* ── Posts List pane ── */}
            {postsViewMode === "posts" && (
              <div className="editor-pane" style={{ background: "var(--bg2)" }}>
                <div className="editor-scroll" style={{ padding: "32px 40px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>All Posts</h2>
                    <button onClick={() => { clearEditor(); setPostsViewMode("editor"); }} style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(0,59,147,0.2)", borderRadius: 7, padding: "5px 14px", cursor: "pointer" }}>+ New Post</button>
                  </div>
                  {allPosts.length === 0 ? (
                    <p style={{ color: "var(--text3)", fontSize: 13 }}>No posts found.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {allPosts.map(p => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
                          {p.image && (
                            <img src={p.image} alt="" style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || "Untitled"}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                              <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.category}</span>
                              <span style={{ fontSize: 10, color: "var(--text3)" }}>·</span>
                              <span style={{ fontSize: 10, color: p.status === "Published" ? "var(--green)" : "var(--orange)" }}>{p.status || "Draft"}</span>
                              <span style={{ fontSize: 10, color: "var(--text3)" }}>·</span>
                              <span style={{ fontSize: 10, color: "var(--text3)" }}>{p.publishedAt}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button
                              onClick={() => loadPostForEdit(p)}
                              style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(0,59,147,0.2)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
                            >Edit</button>
                            <a href={`/article/${p.slug}`} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", textDecoration: "none" }}
                            >View ↗</a>
                            <button
                              onClick={() => handleDeletePost(p)}
                              style={{ fontSize: 11, fontWeight: 600, color: "var(--red, #e53935)", background: "rgba(229,57,53,0.08)", border: "1px solid rgba(229,57,53,0.2)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
                            >Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Editor / Preview pane ── */}
            {postsViewMode === "editor" && <div className="editor-pane">
              {showDraftBanner && draftData && (
                <div style={{
                  background: "var(--orange-dim)", borderBottom: "1px solid rgba(225,114,14,0.2)",
                  padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--orange)",
                }}>
                  <span style={{ flex: 1 }}>
                    You have an unsaved draft from{" "}
                    {draftData.savedAt
                      ? new Date(draftData.savedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "earlier"}.
                  </span>
                  <button onClick={restoreDraft} style={{ fontSize: 12, fontWeight: 600, color: "var(--orange)", background: "none", border: "1px solid rgba(225,114,14,0.35)", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                    Restore
                  </button>
                  <button onClick={discardDraft} style={{ fontSize: 12, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>
                    Discard
                  </button>
                </div>
              )}
              <div className="editor-scroll">
                {viewMode === "write" ? (
                  <TiptapEditor key={editorKey} content={editorInitContent} onChange={handleBodyChange} />
                ) : (
                  <div style={{ padding: "40px 0" }}>
                    <div className="tiptap-outer">
                      <div className="tiptap-prose" dangerouslySetInnerHTML={{ __html: postBody || "<p style='color:#aaa'>Nothing to preview yet.</p>" }} />
                    </div>
                    <div style={{ maxWidth: 340, margin: "48px auto 0", paddingBottom: 80 }}>
                      <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text3)", marginBottom: 10, textAlign: "center" }}>Card Preview</p>
                      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
                        {featuredImage ? (
                          <img src={featuredImage} alt="Featured" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--text3)" }}>No image</span>
                          </div>
                        )}
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{category}</span>
                            <span style={{ fontSize: 10, color: "var(--text3)" }}>{readTime} min read</span>
                          </div>
                          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "var(--text)", lineHeight: 1.3 }}>
                            {postTitle || "Untitled Article"}
                          </h3>
                          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {excerpt || "Your excerpt will appear here…"}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                              {authorObj.initials}
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text2)" }}>{authorObj.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>}

            {/* ══════════════════════════════════════════════
                ── Publish Panel (right) ──
                ══════════════════════════════════════════════ */}
            <aside className="publish-panel">

              {/* ── 1. Core Details ── */}
              <div className="pp-section">
                <SectionHeader title="Core Details" dotColor="var(--accent)" open={openSections.core} onToggle={() => toggleSection("core")} />
                {openSections.core && (
                  <div className="pp-body" style={{ marginTop: 10 }}>

                    {/* Featured Image */}
                    <div>
                      <div className="f-label">Featured Image</div>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                      {featuredImage ? (
                        <div style={{ position: "relative" }}>
                          <img src={featuredImage} alt="Featured" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, display: "block" }} />
                          <button onClick={() => setFeaturedImage("")} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: 4, fontSize: 11, padding: "2px 8px", cursor: "pointer" }}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="img-drop" onClick={() => fileInputRef.current?.click()} style={{ opacity: isUploadingImage ? 0.6 : 1 }}>
                          <div className="img-drop-icon">🖼</div>
                          <div className="img-drop-text">{isUploadingImage ? "Uploading…" : <><b>Click to upload</b> image</>}</div>
                        </div>
                      )}
                    </div>

                    {/* Excerpt */}
                    <div>
                      <div className="f-label">Excerpt <span className="tip">~155 chars</span></div>
                      <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary for the article card…" style={{ minHeight: 80 }} />
                      <div className={`char-counter ${excerptClass}`}>{excerptLen} / 160</div>
                    </div>

                    {/* Slug */}
                    <div>
                      <div className="f-label">URL Slug</div>
                      <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="your-post-slug" />
                      <div className="slug-preview">/article/{slug || "your-post-slug"}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 2. Taxonomy & Skill Level ── */}
              <div className="pp-section">
                <SectionHeader title="Taxonomy & Skill Level" dotColor="var(--blue)" tier="T1" open={openSections.taxonomy} onToggle={() => toggleSection("taxonomy")} />
                {openSections.taxonomy && (
                  <div className="pp-body" style={{ marginTop: 10 }}>

                    {/* Category */}
                    <div>
                      <div className="f-label">Topic Filter</div>
                      <select value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <div className="f-label">Domain Tags</div>
                      <div className="tag-input-wrap" onClick={() => document.getElementById("tag-input")?.focus()}>
                        {tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}<span className="tag-x" onClick={() => setTags(tags.filter(t => t !== tag))}>×</span>
                          </span>
                        ))}
                        <input id="tag-input" className="tag-bare-input" placeholder={tags.length === 0 ? "Add tag, press Enter" : ""} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }} />
                      </div>
                    </div>

                    {/* Skill Level */}
                    <div>
                      <div className="f-label">Skill-Level Badge</div>
                      <div className="skill-selector">
                        {[{ label: "Beginner", cls: "sel-beg" }, { label: "Intermediate", cls: "sel-int" }, { label: "Advanced", cls: "sel-adv" }].map(({ label, cls }) => (
                          <button key={label} className={`skill-opt ${skill === label ? cls : ""}`} onClick={() => setSkill(label)}>{label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Read time */}
                    {readTime > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "var(--bg3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>Estimated read time</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{readTime} min</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. SEO Settings ── */}
              <div className="pp-section">
                <SectionHeader title="SEO Settings" dotColor="var(--green)" open={openSections.seo} onToggle={() => toggleSection("seo")} />
                {openSections.seo && (
                  <div className="pp-body" style={{ marginTop: 10 }}>

                    {/* Score ring */}
                    <div className="seo-score-wrap">
                      <div className="seo-ring">
                        <svg width="44" height="44" viewBox="0 0 44 44">
                          <circle cx="22" cy="22" r="16" fill="none" stroke="var(--bg4)" strokeWidth="4" />
                          <circle cx="22" cy="22" r="16" fill="none" stroke={seoColor} strokeWidth="4"
                            strokeDasharray={`${seoArc} ${circumference}`}
                            strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.4s ease" }}
                          />
                        </svg>
                        <div className="seo-ring-label" style={{ color: seoColor, fontSize: 11 }}>{seoScore}</div>
                      </div>
                      <div className="seo-info">
                        <div className="seo-grade" style={{ color: seoColor }}>{seoGrade}</div>
                        <div className="seo-hint">SEO readiness score</div>
                      </div>
                    </div>

                    {/* Checks */}
                    <div className="seo-checks">
                      {seoChecks.map((c, i) => (
                        <div key={i} className="seo-check">
                          <div className={`ic ${c.pass ? "ic-pass" : c.warn ? "ic-warn" : "ic-fail"}`}>
                            {c.pass ? "✓" : c.warn ? "!" : "✕"}
                          </div>
                          {c.label}
                        </div>
                      ))}
                    </div>

                    {/* Focus keyword */}
                    <div>
                      <div className="f-label">Focus Keyword</div>
                      <input type="text" value={focusKeyword} onChange={e => setFocusKeyword(e.target.value)} placeholder="e.g. machine learning basics" />
                    </div>

                    {/* Meta title */}
                    <div>
                      <div className="f-label">
                        Meta Title
                        <span className={`tip ${metaTitle.length > 60 ? "cc-bad" : ""}`}>{metaTitle.length}/60</span>
                      </div>
                      <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={postTitle || "SEO page title…"} />
                    </div>

                    {/* Meta description */}
                    <div>
                      <div className="f-label">
                        Meta Description
                        <span className={`tip ${metaDesc.length > 160 ? "cc-bad" : metaDesc.length > 120 ? "cc-warn" : ""}`}>{metaDesc.length}/160</span>
                      </div>
                      <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder={excerpt || "Brief description for search results…"} style={{ minHeight: 64 }} />
                    </div>

                    {/* OG Image */}
                    <div>
                      <div className="f-label">OG Image URL <span className="tip">1200×630</span></div>
                      <input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder={featuredImage || "https://…"} />
                    </div>

                    {/* Schema type */}
                    <div>
                      <div className="f-label">Schema Type</div>
                      <select value={schemaType} onChange={e => setSchemaType(e.target.value)}>
                        {SCHEMA_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <div className="f-label">Canonical URL <span className="tip">optional</span></div>
                      <input type="text" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="https://analytixlabs.co.in/…" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 4. Course Mapping ── */}
              <div className="pp-section">
                <SectionHeader title="Course Mapping" dotColor="var(--orange)" tier="T2" open={openSections.courses} onToggle={() => toggleSection("courses")} />
                {openSections.courses && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div className="f-label">Map to Courses</div>
                    {COURSES.map(course => (
                      <label key={course.id} className={`course-check ${mappedCourses.includes(course.id) ? "checked" : ""}`}>
                        <input type="checkbox" checked={mappedCourses.includes(course.id)} onChange={() => toggleCourse(course.id)} />
                        <span className="course-check-label">{course.name}</span>
                      </label>
                    ))}
                    {mappedCourses.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div className="f-label">Custom CTA Headline</div>
                        <input type="text" value={courseCTA} onChange={e => setCourseCTA(e.target.value)} placeholder="Ready to go deeper? Enroll now →" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 5. Lead Magnet & CTA ── */}
              <div className="pp-section">
                <SectionHeader title="Lead Magnet & CTA" dotColor="var(--red)" tier="T2" open={openSections.leadmagnet} onToggle={() => toggleSection("leadmagnet")} />
                {openSections.leadmagnet && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div>
                      <div className="f-label">Newsletter Placement</div>
                      <select value={newsletterPlacement} onChange={e => setNewsletterPlacement(e.target.value)}>
                        <option value="after-intro">After intro</option>
                        <option value="mid-article">Mid article</option>
                        <option value="end">End of article</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <div className="f-label">Lead Magnet PDF</div>
                      <select value={leadMagnetPDF} onChange={e => setLeadMagnetPDF(e.target.value)}>
                        {LEAD_MAGNETS.map(lm => <option key={lm.id} value={lm.id}>{lm.name}</option>)}
                      </select>
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-label">Exit-intent popup</span>
                      <Toggle checked={exitIntentEnabled} onChange={setExitIntentEnabled} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 6. Knowledge Check Questions ── */}
              <div className="pp-section">
                <SectionHeader title="Knowledge Check" dotColor="var(--blue)" tier="T2" open={openSections.quiz} onToggle={() => toggleSection("quiz")} />
                {openSections.quiz && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    {quizQuestions.map((q, qi) => (
                      <div key={q.id} className="quiz-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, flex: 1 }}>Q{qi + 1}</span>
                          <button onClick={() => removeQuizQuestion(q.id)} style={{ fontSize: 10, color: "var(--red)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
                        </div>
                        <input
                          type="text"
                          className="quiz-q"
                          value={q.question}
                          onChange={e => updateQuizQuestion(q.id, "question", e.target.value)}
                          placeholder="Enter question…"
                          style={{ background: "transparent", border: "none", outline: "none", width: "100%", fontSize: 12, color: "var(--text2)", padding: 0 }}
                        />
                        <div className="quiz-opts-row">
                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ position: "relative" }}>
                              <input
                                type="text"
                                value={opt}
                                onChange={e => updateQuizOption(q.id, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                                className={`quiz-opt ${q.correctIndex === oi ? "correct" : ""}`}
                                style={{ width: "100%", border: "none", outline: "none", cursor: "text", background: "transparent" }}
                              />
                              <button
                                onClick={() => updateQuizQuestion(q.id, "correctIndex", oi)}
                                title="Mark as correct"
                                style={{
                                  position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%",
                                  border: `1.5px solid ${q.correctIndex === oi ? "var(--green)" : "var(--border2)"}`,
                                  background: q.correctIndex === oi ? "var(--green)" : "transparent",
                                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 7, color: q.correctIndex === oi ? "#fff" : "var(--text3)", padding: 0,
                                }}
                              >{q.correctIndex === oi ? "✓" : ""}</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="quiz-add-btn" onClick={addQuizQuestion}>
                      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add question
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-label">GA4 event tracking</span>
                      <Toggle checked={ga4TrackingEnabled} onChange={setGa4TrackingEnabled} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 7. AI Recommendation Hints ── */}
              <div className="pp-section">
                <SectionHeader title="AI Recommendation Hints" dotColor="var(--accent)" tier="T1" open={openSections.ai} onToggle={() => toggleSection("ai")} />
                {openSections.ai && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div className="toggle-row">
                      <span className="toggle-label">Include in AI recommendations</span>
                      <Toggle checked={aiInclusionEnabled} onChange={setAiInclusionEnabled} />
                    </div>
                    <div>
                      <div className="f-label">Concept Entity Tags <span className="tip">for embeddings</span></div>
                      <div className="tag-input-wrap" onClick={() => document.getElementById("entity-tag-input")?.focus()}>
                        {entityTags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}<span className="tag-x" onClick={() => setEntityTags(entityTags.filter(t => t !== tag))}>×</span>
                          </span>
                        ))}
                        <input id="entity-tag-input" className="tag-bare-input" placeholder={entityTags.length === 0 ? "neural network, overfitting…" : ""} value={entityTagInput} onChange={e => setEntityTagInput(e.target.value)} onKeyDown={handleEntityTagKeyDown} onBlur={() => { if (entityTagInput.trim()) addEntityTag(entityTagInput); }} />
                      </div>
                    </div>
                    <div>
                      <div className="f-label">Manual Related Post IDs <span className="tip">comma-separated</span></div>
                      <input type="text" value={relatedPostIds} onChange={e => setRelatedPostIds(e.target.value)} placeholder="12, 45, 78" />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 8. Author & Trust Signals ── */}
              <div className="pp-section">
                <SectionHeader title="Author & Trust Signals" dotColor="var(--green)" tier="T3" open={openSections.author} onToggle={() => toggleSection("author")} />
                {openSections.author && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div>
                      <div className="f-label">Author</div>
                      <select value={authorId} onChange={e => setAuthorId(e.target.value)}>
                        {Object.entries(authors).map(([key, a]) => (
                          <option key={key} value={key}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="f-label">Author Bio <span className="tip">override</span></div>
                      <textarea value={authorBio} onChange={e => setAuthorBio(e.target.value)} placeholder="Short bio for this article's byline…" style={{ minHeight: 64 }} />
                    </div>
                    <div>
                      <div className="f-label">Fact-Checker</div>
                      <input type="text" value={factChecker} onChange={e => setFactChecker(e.target.value)} placeholder="Reviewer name or credential" />
                    </div>
                    <div>
                      <div className="f-label">Last Reviewed Date</div>
                      <input type="date" value={lastReviewedDate} onChange={e => setLastReviewedDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── 9. Discussion Settings ── */}
              <div className="pp-section">
                <SectionHeader title="Discussion Settings" dotColor="var(--orange)" tier="T3" open={openSections.discussion} onToggle={() => toggleSection("discussion")} />
                {openSections.discussion && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div className="toggle-row">
                      <span className="toggle-label">Enable Q&A section</span>
                      <Toggle checked={qaEnabled} onChange={setQaEnabled} />
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-label">Extract FAQ schema</span>
                      <Toggle checked={faqSchemaEnabled} onChange={setFaqSchemaEnabled} />
                    </div>
                    <div>
                      <div className="f-label">Moderation Mode</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {["auto", "manual", "off"].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setModerationMode(mode)}
                            style={{
                              padding: "6px 0", borderRadius: "var(--radius)", border: "1px solid var(--border)",
                              fontSize: 11, fontWeight: 500, cursor: "pointer", textTransform: "capitalize",
                              background: moderationMode === mode ? "var(--accent-dim)" : "var(--bg3)",
                              color: moderationMode === mode ? "var(--accent)" : "var(--text3)",
                              borderColor: moderationMode === mode ? "rgba(0,59,147,0.25)" : "var(--border)",
                            }}
                          >{mode}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 10. Advanced / Accessibility ── */}
              <div className="pp-section">
                <SectionHeader title="Advanced / Accessibility" dotColor="var(--text3)" tier="T3" open={openSections.advanced} onToggle={() => toggleSection("advanced")} />
                {openSections.advanced && (
                  <div className="pp-body" style={{ marginTop: 10 }}>
                    <div className="toggle-row">
                      <span className="toggle-label">Semantic search index</span>
                      <Toggle checked={semanticIndexEnabled} onChange={setSemanticIndexEnabled} />
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-label">Include in salary hub</span>
                      <Toggle checked={salaryHubEnabled} onChange={setSalaryHubEnabled} />
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-label">Dark mode compatible</span>
                      <Toggle checked={darkModeCompat} onChange={setDarkModeCompat} />
                    </div>
                    <div>
                      <div className="f-label">Reading progress bar color</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="color"
                          value={progressBarColor}
                          onChange={e => setProgressBarColor(e.target.value)}
                          style={{ width: 32, height: 28, padding: 2, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", background: "var(--bg3)" }}
                        />
                        <input
                          type="text"
                          value={progressBarColor}
                          onChange={e => setProgressBarColor(e.target.value)}
                          style={{ flex: 1, fontFamily: "monospace" }}
                        />
                      </div>
                      <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: progressBarColor, opacity: 0.85 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Publish CTA bar ── */}
              <div className="publish-bar">
                <div className="publish-status">
                  <span className="status-dot" style={isSaved || isPublished ? { background: "var(--green)", animation: "none" } : {}} />
                  {saveStatus}
                </div>
                {editingPostId !== null ? (
                  <div className="btn-row">
                    <button
                      className="btn btn-schedule"
                      onClick={() => { setEditingPostId(null); clearEditor(); }}
                      disabled={isPublishing}
                      title="Discard edits and start fresh"
                    >✕ Exit Edit</button>
                    <button className="btn btn-publish" onClick={updatePost} disabled={isPublishing}>
                      {isPublishing ? "Saving…" : "Update"}
                    </button>
                  </div>
                ) : (
                  <div className="btn-row">
                    <button className="btn btn-schedule" onClick={schedulePost} disabled={isPublishing}>Schedule</button>
                    <button className="btn btn-publish" onClick={publishPost} disabled={isPublishing}>
                      {isPublishing ? "Publishing…" : "Publish"}
                    </button>
                  </div>
                )}
              </div>

            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
