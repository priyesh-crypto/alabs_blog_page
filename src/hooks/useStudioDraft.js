"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { STUDIO_DRAFT_KEY } from "@/lib/config";

// ── Initial state ────────────────────────────────────────────
const INITIAL_STATE = {
  // Content
  postBody: "",
  postTitle: "",
  slug: "",
  readTime: 0,
  wordCount: 0,
  excerpt: "",

  // Metadata
  category: "Machine Learning",
  authorId: "al-editorial",
  skill: "Beginner",
  tags: [],
  tagInput: "",
  featuredImage: "",
  cardImage: "",
  squareImage: "",
  altText: "",
  altTextError: "",
  isUploadingImage: false,
  isUploadingCardImage: false,
  isUploadingSquareImage: false,

  // Inline widgets (keyed by UUID, created on insert)
  widgets: {},
  activeWidgetId: null,

  // SEO
  focusKeyword: "",
  metaTitle: "",
  metaDesc: "",
  ogImage: "",
  schemaType: "Article",
  canonicalUrl: "",

  // Course Mapping
  mappedCourses: [],
  courseCTA: "",

  // Lead Magnet
  newsletterPlacement: "after-intro",
  leadMagnetPDF: "none",
  exitIntentEnabled: false,

  // AI Hints
  entityTags: [],
  entityTagInput: "",
  relatedPostIds: "",
  aiInclusionEnabled: true,

  // Author & Trust
  authorBio: "",
  factChecker: "",
  lastReviewedDate: "",

  // Discussion
  qaEnabled: false,
  faqSchemaEnabled: false,
  moderationMode: "auto",
  editorComments: [],

  // Advanced
  noIndex: false,
  semanticIndexEnabled: true,
  salaryHubEnabled: false,
  darkModeCompat: true,
  progressBarColor: "#0f2554",

  // Layout Visibility
  showLeadGen: true,
  showNextSteps: true,
  showCourseCta: true,
  showRightSidebar: true,

  // UI
  isPublishing: false,
  saveStatus: "Draft",
  isSaved: false,
  showDraftBanner: false,
  draftData: null,
  viewMode: "write",       // "write" | "preview"
  postsViewMode: "editor", // "editor" | "posts"
  editorKey: 0,
  editorInitContent: "<h1></h1><p></p>",
  editingPostId: null,
  allPosts: [],
  activeTab: "details",    // "details" | "seo" | "advanced"
  showScheduleModal: false,
  showShareModal: false,
  showVersionHistory: false,
  versions: [],
  versionPreview: null,
  statusConfirmPost: null,
  toast: null,

  // Toolbar state (driven by editor)
  tbState: { bold: false, italic: false, underline: false, strike: false, h2: false, h3: false, bullet: false, ordered: false, fontFamily: "" },

  // Collapsible sections
  openSections: {
    courses: false, leadmagnet: false,
    ai: false, author: false, discussion: false, advanced: false,
  },
};

// ── Reducer ──────────────────────────────────────────────────
function studioReducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };

    case "SET_MANY":
      return { ...state, ...action.payload };

    case "TOGGLE_SECTION":
      return {
        ...state,
        openSections: {
          ...state.openSections,
          [action.key]: !state.openSections[action.key],
        },
      };

    case "ADD_TAG": {
      const t = action.value.trim().replace(/,/g, "");
      if (!t || state.tags.includes(t)) return { ...state, tagInput: "" };
      return { ...state, tags: [...state.tags, t], tagInput: "" };
    }

    case "REMOVE_TAG":
      return { ...state, tags: state.tags.filter((t) => t !== action.value) };

    case "POP_TAG":
      return { ...state, tags: state.tags.slice(0, -1) };

    case "ADD_ENTITY_TAG": {
      const t = action.value.trim().replace(/,/g, "");
      if (!t || state.entityTags.includes(t)) return { ...state, entityTagInput: "" };
      return { ...state, entityTags: [...state.entityTags, t], entityTagInput: "" };
    }

    case "REMOVE_ENTITY_TAG":
      return { ...state, entityTags: state.entityTags.filter((t) => t !== action.value) };

    case "POP_ENTITY_TAG":
      return { ...state, entityTags: state.entityTags.slice(0, -1) };

    case "TOGGLE_COURSE": {
      const id = action.value;
      return {
        ...state,
        mappedCourses: state.mappedCourses.includes(id)
          ? state.mappedCourses.filter((c) => c !== id)
          : [...state.mappedCourses, id],
      };
    }

    case "ADD_WIDGET": {
      const widgetDefaults = {
        quiz:        { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" },
        newsletter:  { headline: "", subtext: "", ctaLabel: "Subscribe →" },
        coursematch: { courseId: null, ctaHeadline: "" },
        nextsteps:   { steps: ["", "", ""] },
      };
      return {
        ...state,
        activeWidgetId: action.id,
        widgets: {
          ...state.widgets,
          [action.id]: { type: action.widgetType, ...(widgetDefaults[action.widgetType] ?? {}) },
        },
      };
    }

    case "UPDATE_WIDGET":
      if (!state.widgets[action.id]) return state;
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.id]: { ...state.widgets[action.id], ...action.data },
        },
      };

    case "REMOVE_WIDGET": {
      const remaining = { ...state.widgets };
      delete remaining[action.id];
      return {
        ...state,
        widgets: remaining,
        activeWidgetId: state.activeWidgetId === action.id ? null : state.activeWidgetId,
      };
    }

    case "SET_ACTIVE_WIDGET":
      return { ...state, activeWidgetId: action.id ?? null };

    case "RESTORE_DRAFT": {
      const d = action.draft;
      return {
        ...state,
        postBody: d.postBody || "",
        postTitle: d.postTitle || "",
        slug: d.slug || "",
        excerpt: d.excerpt || "",
        category: d.category || "Machine Learning",
        authorId: d.authorId || "al-editorial",
        skill: d.skill || "Beginner",
        tags: d.tags || [],
        featuredImage: d.featuredImage || "",
        cardImage: d.cardImage || "",
        squareImage: d.squareImage || "",
        altText: d.altText || "",
        altTextError: "",
        focusKeyword: d.focusKeyword || "",
        metaTitle: d.metaTitle || "",
        metaDesc: d.metaDesc || "",
        ogImage: d.ogImage || "",
        schemaType: d.schemaType || "Article",
        canonicalUrl: d.canonicalUrl || "",
        mappedCourses: d.mappedCourses || [],
        courseCTA: d.courseCTA || "",
        newsletterPlacement: d.newsletterPlacement || "after-intro",
        leadMagnetPDF: d.leadMagnetPDF || "none",
        exitIntentEnabled: d.exitIntentEnabled || false,
        entityTags: d.entityTags || [],
        relatedPostIds: d.relatedPostIds || "",
        aiInclusionEnabled: d.aiInclusionEnabled !== false,
        authorBio: d.authorBio || "",
        factChecker: d.factChecker || "",
        lastReviewedDate: d.lastReviewedDate || "",
        qaEnabled: d.qaEnabled || false,
        faqSchemaEnabled: d.faqSchemaEnabled || false,
        moderationMode: d.moderationMode || "auto",
        editorComments: d.editorComments || [],
        noIndex: d.noIndex || false,
        semanticIndexEnabled: d.semanticIndexEnabled !== false,
        salaryHubEnabled: d.salaryHubEnabled || false,
        darkModeCompat: d.darkModeCompat !== false,
        progressBarColor: d.progressBarColor || "#0f2554",
        showLeadGen: d.showLeadGen !== false,
        showNextSteps: d.showNextSteps !== false,
        showCourseCta: d.showCourseCta !== false,
        showRightSidebar: d.showRightSidebar !== false,
        widgets: d.widgets || {},
        activeWidgetId: null,
        editorInitContent: d.postBody || "<h1></h1><p></p>",
        editorKey: state.editorKey + 1,
        showDraftBanner: false,
        saveStatus: "Saved",
        isSaved: true,
      };
    }

    case "LOAD_POST": {
      const p = action.post;
      return {
        ...state,
        editingPostId: p.id,
        postBody: p.content || "",
        postTitle: p.title || "",
        slug: p.slug || "",
        excerpt: p.excerpt || "",
        category: p.category || "Machine Learning",
        authorId: p.authorId || "al-editorial",
        skill: p.skill_level || "Beginner",
        tags: p.domain_tags || [],
        tagInput: "",
        featuredImage: p.image || "",
        cardImage: p.advanced?.cardImage || "",
        squareImage: p.advanced?.squareImage || "",
        altText: p.alt_text || p.altText || "",
        altTextError: "",
        focusKeyword: p.seo?.focusKeyword || "",
        metaTitle: p.seo?.metaTitle || "",
        metaDesc: p.seo?.metaDesc || "",
        ogImage: p.seo?.ogImage || "",
        schemaType: p.seo?.schemaType || "Article",
        canonicalUrl: p.seo?.canonicalUrl || "",
        mappedCourses: p.courseMappings || [],
        courseCTA: p.courseCTA || "",
        newsletterPlacement: p.newsletter?.placement || "after-intro",
        leadMagnetPDF: p.newsletter?.leadMagnet || "none",
        exitIntentEnabled: p.newsletter?.exitIntent || false,
        entityTags: p.aiHints?.entityTags || [],
        relatedPostIds: (p.aiHints?.relatedPostIds || []).join(", "),
        aiInclusionEnabled: p.aiHints?.enabled !== false,
        authorBio: p.trust?.authorBio || "",
        factChecker: p.trust?.factChecker || "",
        lastReviewedDate: p.trust?.lastReviewedDate || "",
        qaEnabled: p.discussion?.qa || false,
        faqSchemaEnabled: p.discussion?.faqSchema || false,
        moderationMode: p.discussion?.moderation || "auto",
        editorComments: p.discussion?.editorComments || [],
        noIndex: p.seo?.noIndex || false,
        semanticIndexEnabled: p.advanced?.semanticIndex !== false,
        salaryHubEnabled: p.advanced?.salaryHub || false,
        darkModeCompat: p.advanced?.darkModeCompat !== false,
        progressBarColor: p.advanced?.progressBarColor || "#0f2554",
        showLeadGen: p.advanced?.showLeadGen !== false,
        showNextSteps: p.advanced?.showNextSteps !== false,
        showCourseCta: p.advanced?.showCourseCta !== false,
        showRightSidebar: p.advanced?.showRightSidebar !== false,
        widgets: p.advanced?.widgets || {},
        activeWidgetId: null,
        editorInitContent: p.content || "<h1></h1><p></p>",
        editorKey: state.editorKey + 1,
        saveStatus: "Saved",
        isSaved: true,
        postsViewMode: "editor",
        viewMode: "write",
        wordCount: 0,
        readTime: 0,
      };
    }

    case "RESET":
      return {
        ...INITIAL_STATE,
        editorKey: state.editorKey + 1,
        allPosts: state.allPosts, // preserve post list
      };

    default:
      return state;
  }
}

// ── Draft payload builder (eliminates 3× duplication) ────────
function buildDraftPayload(s) {
  return {
    postBody: s.postBody, postTitle: s.postTitle, slug: s.slug, excerpt: s.excerpt,
    category: s.category, authorId: s.authorId, skill: s.skill, tags: s.tags,
    featuredImage: s.featuredImage, cardImage: s.cardImage, squareImage: s.squareImage,
    altText: s.altText, focusKeyword: s.focusKeyword, metaTitle: s.metaTitle,
    metaDesc: s.metaDesc, ogImage: s.ogImage, schemaType: s.schemaType, canonicalUrl: s.canonicalUrl,
    mappedCourses: s.mappedCourses, courseCTA: s.courseCTA,
    newsletterPlacement: s.newsletterPlacement, leadMagnetPDF: s.leadMagnetPDF,
    exitIntentEnabled: s.exitIntentEnabled, entityTags: s.entityTags,
    relatedPostIds: s.relatedPostIds, aiInclusionEnabled: s.aiInclusionEnabled,
    authorBio: s.authorBio, factChecker: s.factChecker, lastReviewedDate: s.lastReviewedDate,
    qaEnabled: s.qaEnabled, faqSchemaEnabled: s.faqSchemaEnabled, moderationMode: s.moderationMode, editorComments: s.editorComments,
    semanticIndexEnabled: s.semanticIndexEnabled, salaryHubEnabled: s.salaryHubEnabled,
    darkModeCompat: s.darkModeCompat, progressBarColor: s.progressBarColor,
    widgets: s.widgets,
    showLeadGen: s.showLeadGen, showNextSteps: s.showNextSteps,
    showCourseCta: s.showCourseCta, showRightSidebar: s.showRightSidebar,
    savedAt: new Date().toISOString(),
  };
}

// ── Publish payload builder ──────────────────────────────────
export function buildPublishPayload(s, userId) {
  return {
    title: s.postTitle,
    slug: s.slug || s.postTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
    excerpt: s.excerpt, content: s.postBody, category: s.category,
    domain_tags: s.tags, skill_level: s.skill,
    readTime: `${s.readTime} min read`, authorId: userId || s.authorId,
    image: s.featuredImage,
    alt_text: s.altText,
    seo: { focusKeyword: s.focusKeyword, metaTitle: s.metaTitle || s.postTitle, metaDesc: s.metaDesc || s.excerpt, ogImage: s.ogImage || s.featuredImage, schemaType: s.schemaType, canonicalUrl: s.canonicalUrl, noIndex: s.noIndex },
    courseMappings: s.mappedCourses, courseCTA: s.courseCTA,
    newsletter: { placement: s.newsletterPlacement, leadMagnet: s.leadMagnetPDF, exitIntent: s.exitIntentEnabled },
    aiHints: { entityTags: s.entityTags, relatedPostIds: s.relatedPostIds.split(",").map((x) => x.trim()).filter(Boolean), enabled: s.aiInclusionEnabled },
    trust: { authorBio: s.authorBio, factChecker: s.factChecker, lastReviewedDate: s.lastReviewedDate },
    discussion: { qa: s.qaEnabled, faqSchema: s.faqSchemaEnabled, moderation: s.moderationMode, editorComments: s.editorComments || [] },
    advanced: { semanticIndex: s.semanticIndexEnabled, salaryHub: s.salaryHubEnabled, darkModeCompat: s.darkModeCompat, progressBarColor: s.progressBarColor, cardImage: s.cardImage, squareImage: s.squareImage, widgets: s.widgets, showLeadGen: s.showLeadGen, showNextSteps: s.showNextSteps, showCourseCta: s.showCourseCta, showRightSidebar: s.showRightSidebar },
  };
}

// ── The hook ─────────────────────────────────────────────────
export default function useStudioDraft() {
  const [state, dispatch] = useReducer(studioReducer, INITIAL_STATE);
  const draftTimerRef = useRef(null);

  // Shorthand setter
  const set = useCallback((field, value) => dispatch({ type: "SET", field, value }), []);
  const setMany = useCallback((payload) => dispatch({ type: "SET_MANY", payload }), []);

  // Toast helper
  const showToast = useCallback((msg, type = "ok") => {
    dispatch({ type: "SET", field: "toast", value: { msg, type, id: Date.now() } });
  }, []);

  // Check for saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(STUDIO_DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.postBody) {
          dispatch({ type: "SET_MANY", payload: { draftData: draft, showDraftBanner: true } });
        }
      } catch {}
    }
  }, []);

  // Word count + read time — recalculate whenever postBody changes
  useEffect(() => {
    if (!state.postBody) {
      dispatch({ type: "SET_MANY", payload: { wordCount: 0, readTime: 0 } });
      return;
    }
    // Strip HTML tags to count only text words
    const text = state.postBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').filter(Boolean).length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    dispatch({ type: "SET_MANY", payload: { wordCount: words, readTime: minutes } });
  }, [state.postBody]);

  // Auto-save (debounced 1.5s)
  useEffect(() => {
    if (!state.postBody && !state.postTitle) return;
    clearTimeout(draftTimerRef.current);
    dispatch({ type: "SET_MANY", payload: { saveStatus: "Unsaved", isSaved: false } });
    draftTimerRef.current = setTimeout(() => {
      localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(buildDraftPayload(state)));
      dispatch({ type: "SET_MANY", payload: { saveStatus: "Saved", isSaved: true } });
    }, 1500);
    return () => clearTimeout(draftTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.postBody, state.postTitle, state.slug, state.excerpt, state.category,
    state.authorId, state.skill, state.tags, state.featuredImage, state.cardImage, state.squareImage, state.widgets,
    state.focusKeyword, state.metaTitle, state.metaDesc, state.ogImage,
    state.schemaType, state.canonicalUrl, state.mappedCourses, state.courseCTA,
    state.newsletterPlacement, state.leadMagnetPDF, state.exitIntentEnabled,
    state.entityTags,
    state.relatedPostIds, state.aiInclusionEnabled, state.authorBio,
    state.factChecker, state.lastReviewedDate, state.qaEnabled,
    state.faqSchemaEnabled, state.moderationMode, state.semanticIndexEnabled,
    state.salaryHubEnabled, state.darkModeCompat, state.progressBarColor,
    state.showLeadGen, state.showNextSteps, state.showCourseCta, state.showRightSidebar,
  ]);

  // Manual save
  const saveDraftManually = useCallback(() => {
    if (!state.postTitle && !state.postBody) { showToast("Nothing to save yet", "err"); return; }
    clearTimeout(draftTimerRef.current);
    localStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify(buildDraftPayload(state)));
    dispatch({ type: "SET_MANY", payload: { saveStatus: "Saved", isSaved: true } });
    showToast("Draft saved locally");
  }, [state, showToast]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    if (!state.draftData) return;
    dispatch({ type: "RESTORE_DRAFT", draft: state.draftData });
    showToast("Draft restored");
  }, [state.draftData, showToast]);

  // Discard draft
  const discardDraft = useCallback(() => {
    localStorage.removeItem(STUDIO_DRAFT_KEY);
    dispatch({ type: "SET_MANY", payload: { draftData: null, showDraftBanner: false } });
  }, []);

  // Clear editor (new post)
  const clearEditor = useCallback(() => {
    if (state.postBody && !window.confirm("Start a new post? Unsaved changes will be lost.")) return;
    localStorage.removeItem(STUDIO_DRAFT_KEY);
    dispatch({ type: "RESET" });
  }, [state.postBody]);

  const clearDraftOnSuccess = useCallback(() => localStorage.removeItem(STUDIO_DRAFT_KEY), []);

  // Fetch all posts from the server (studio use: returns all statuses)
  const fetchAllPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?all=true');
      if (!res.ok) return;
      const posts = await res.json();
      dispatch({ type: "SET", field: "allPosts", value: Array.isArray(posts) ? posts : [] });
    } catch (err) {
      console.error('fetchAllPosts failed:', err);
    }
  }, [dispatch]);

  // Load an existing post into the editor
  const loadPostForEdit = useCallback((post) => {
    dispatch({ type: "LOAD_POST", post });
  }, [dispatch]);

  return {
    state, dispatch, set, setMany, showToast,
    saveDraftManually, restoreDraft, discardDraft, clearEditor, clearDraftOnSuccess,
    fetchAllPosts, loadPostForEdit,
  };
}
