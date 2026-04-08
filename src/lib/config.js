/**
 * Site-wide configuration — single source of truth.
 *
 * Import from here instead of hardcoding strings/arrays in pages.
 * All constants are grouped by feature area.
 */

// ── Branding & SEO ────────────────────────────────────────────────
export const SITE_NAME        = "AnalytixLabs Editorial";
export const SITE_TAGLINE     = "Data Science & AI Insights";
export const SITE_DESCRIPTION = "Deep, authoritative insights into Data Science, Machine Learning, AI, and Analytics from industry experts at AnalytixLabs.";
export const COPYRIGHT_YEAR   = new Date().getFullYear();

// ── Navigation ────────────────────────────────────────────────────
export const NAV_CATEGORIES = [
  { label: "Data Science",      href: "/" },
  { label: "Machine Learning",  href: "/" },
  { label: "AI",                href: "/" },
  { label: "Analytics",         href: "/" },
  { label: "Deep Learning",     href: "/" },
  { label: "Salary Hub",        href: "/salary-hub" },
];

export const MOBILE_NAV_ITEMS = [
  { id: "home",     icon: "home",     label: "Home",     href: "/" },
  { id: "insights", icon: "article",  label: "Insights", href: "/article" },
  { id: "courses",  icon: "school",   label: "Courses",  href: "#courses" },
  { id: "saved",    icon: "bookmark", label: "Saved",    href: "#" },
];

export const FOOTER_LINKS = [
  { label: "About Us",             href: "#" },
  { label: "Research Methodology", href: "#" },
  { label: "Careers",              href: "#" },
  { label: "Privacy Policy",       href: "#" },
  { label: "Terms of Service",     href: "#" },
];

// ── Filtering ─────────────────────────────────────────────────────
export const FILTER_CHIPS = [
  "Hot Topic",
  "Data Science",
  "Deep Learning",
  "Business Analyst",
  "Cyber Security",
];

export const SKILL_LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export const TOPIC_OPTIONS = [
  "Data Science",
  "Machine Learning",
  "Deep Learning",
  "AI Engineering",
  "Analytics",
  "Career Growth",
];

// ── Sidebar Salary Widget ─────────────────────────────────────────
export const SALARY_PREVIEW_ROWS = [
  { role: "Data Scientist", range: "₹18–28 LPA", meta: "Bangalore · 3-5 yrs", badge: null },
  { role: "ML Engineer",    range: "₹18–28 LPA", meta: "Mumbai · 2-4 yrs",    badge: null },
  { role: "Data Analyst",   range: "₹10–20 LPA", meta: "Delhi NCR · 0-3 yrs", badge: null },
  { role: "AI Researcher",  range: "₹18–28 LPA", meta: "Pan India · 6+ yrs",  badge: "New" },
];

// ── AI Assistant ──────────────────────────────────────────────────
export const AI_CONTEXT = "AnalytixLabs blog covering Data Science, Machine Learning, AI, Analytics, and career growth in India.";

export const SUGGESTED_AI_QUERIES = [
  "I'm a beginner, where to start?",
  "Best Python libraries for data science?",
  "How to build a machine learning portfolio?",
  "SQL vs Python for data analysis?",
  "Generative AI career roadmap 2026",
];

// ── Newsletter ────────────────────────────────────────────────────
export const NEWSLETTER = {
  title:       "Weekly Data Science Digest",
  subtitle:    "Join 50,000+ data professionals. Research, tutorials & career insights, every Friday.",
  placeholder: "Enter your work email",
  cta:         "Subscribe →",
  footnote:    "Free gift: Data Science Career Roadmap 2026 PDF on sign-up",
};

// ── Discussion / Comments ─────────────────────────────────────────
export const DEFAULT_COMMENTS = [
  {
    id: 1,
    user: "Ravi S.",
    time: "2 days ago",
    text: "Great breakdown! Can you cover Weaviate vs Pinecone comparison in the next article?",
    likes: 0,
    replies: [],
  },
  {
    id: 2,
    user: "Priya M.",
    time: "4 days ago",
    text: "The HNSW section was super clarifying. Bookmarked this for my team.",
    likes: 0,
    replies: [],
  },
];

// ── Featured Author slug ──────────────────────────────────────────
export const FEATURED_AUTHOR_SLUG = "al-editorial";

// ── Studio Constants ──────────────────────────────────────────────
export const STUDIO_DRAFT_KEY = "alabs_studio_draft";

export const STUDIO_CATEGORIES = [
  "Machine Learning",
  "Data Science",
  "Engineering",
  "Career Growth",
];

export const STUDIO_COURSES = [
  { id: "ml-fundamentals",      name: "ML Fundamentals" },
  { id: "data-science-bootcamp", name: "Data Science Bootcamp" },
  { id: "python-for-data",      name: "Python for Data" },
  { id: "deep-learning-pro",    name: "Deep Learning Pro" },
  { id: "sql-analytics",        name: "SQL & Analytics" },
];

export const STUDIO_LEAD_MAGNETS = [
  { id: "none",            name: "None" },
  { id: "ml-cheatsheet",   name: "ML Cheatsheet PDF" },
  { id: "sql-guide",       name: "SQL Quick Guide" },
  { id: "career-roadmap",  name: "Career Roadmap PDF" },
  { id: "python-snippets", name: "Python Snippets PDF" },
];

export const STUDIO_SCHEMA_TYPES = [
  "Article",
  "BlogPosting",
  "TechArticle",
  "HowTo",
  "FAQPage",
];

export const STUDIO_NEWSLETTER_PLACEMENTS = [
  { id: "after-intro",  label: "After intro" },
  { id: "mid-article",  label: "Mid article" },
  { id: "end",          label: "End of article" },
  { id: "none",         label: "None" },
];

export const STUDIO_MODERATION_MODES = ["auto", "manual", "off"];
