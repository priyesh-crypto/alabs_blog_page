/**
 * Client-safe data — static author profiles, courses, salary computation.
 *
 * This file is safe to import from "use client" components.
 * For Supabase-backed post queries, use data.server.js instead.
 */

// ── Authors ───────────────────────────────────────────────────────
export const authors = {
  "al-editorial": {
    slug: "al-editorial",
    name: "AL Labs Editorial",
    initials: "AL",
    color: "bg-primary",
    bio: "The AnalytixLabs internal writing team, curating the best in data science education.",
    linkedin: "https://linkedin.com/company/analytixlabs",
    expertise: ["Data Science Education", "Career Advice"],
    experience: "12 Years",
    image: "/authors/default.png",
  },
};

// ── Courses ───────────────────────────────────────────────────────
export const courses = [
  {
    id: "ds-spec",
    title: "Data Science Specialization",
    label: "Specialization",
    domain_tags: ["Statistics", "Python", "Machine Learning"],
    desc: "Master Python, SQL, and predictive modeling with real-world industry capstones.",
    duration: "6 months",
    rating: 4.8,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh8ivFg8VBjm2zpSqFnI-3MkdXemZRSmKL2fjdyxcBS8zcU2-UO7L4MgVMkbcKU7QeMp3AqnZyLnQMcFIVIDy-nOePtrXzxxBb-dIcantQaJlGrtdaim5JYD9yWkTTplcGh1YMilpDaNpYC3dURy4WxcN0XHtCOyLrIOITJbAnk1suzP0SV1aXc6H3_N4wxno_E7HfrPo399y67upgN34RsH2sZgD2ZRpy-IB5AiUXzj8CXMgxrqdKopbcQjvx_VNVXcXoInX2wlSG",
  },
  {
    id: "ml-mastery",
    title: "Machine Learning Mastery",
    label: "Advanced",
    domain_tags: ["Deep Learning", "Generative AI", "PyTorch"],
    desc: "Deep dive into neural networks, reinforcement learning, and advanced algorithms.",
    duration: "4 months",
    rating: 4.7,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwHYUYKnycf2FxVMoMCwQ1UgZgFyXDw8j_lUAbdLeOtbVyqvKgCAj_9A4FbNSI_SCYRy9wt--t0aRl_dUOO9YxKorbLZ4y6AxJFXAkA3CcgxkLwIOAXVLnNgvbeI7RaERrw0KGpDug9OZVgDwzno0OEQ6TrcqtPAgu_sHsjWmEwHiCaJtigft21XzPpMDMA8xuf2W5vW-g-36ROGFSPY7HTTEaRHDv93wFbGeaUkAS_p5GOysPBVryKY1hp_pFwOBRVP2Fwbe3Y41X",
  },
  {
    id: "ai-eng",
    title: "AI Engineering",
    label: "Engineering",
    domain_tags: ["MLOps", "Data Engineering", "Generative AI"],
    desc: "Build and deploy large-scale AI applications using modern RAG and LLM stacks.",
    duration: "5 months",
    rating: 4.9,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRG-_Ndw0YrduOsgmsEJX_Jm6TR75Ghzm5RN42hzi5WzxAtIWIMEmQWKMhxdA2yLswwhqDOOt5qWJvLsRRcZ1KFCxAWb7559VQIkaC5hFUjsKiQ_lq33vk-a-nRYYkIoXe30BuU8B6HIhXbsgE7eUNcrpzEvnl4QHQNSUYsY-tn5MvhnDXDVwQKmYyw_YWkOVOO5RSEpGsI0zdiNdkAOlNxZERYHt34IrTHdrZc7QKenh9t4Yxcx3Kvkxbht8V-qBJqfwXHIYWftur",
  },
];

// ── Salary Data ───────────────────────────────────────────────────
export const salaryData = {
  "Data Scientist": {
    base: { Bangalore: 12, "Delhi NCR": 10, Mumbai: 11, Hyderabad: 10 },
    multiplier: { "0-2": 1.0, "3-5": 1.5, "6-10": 2.2, "10+": 3.5 },
  },
  "Data Engineer": {
    base: { Bangalore: 11, "Delhi NCR": 9, Mumbai: 10, Hyderabad: 9.5 },
    multiplier: { "0-2": 1.0, "3-5": 1.4, "6-10": 2.0, "10+": 3.0 },
  },
  "AI Engineer / ML Engineer": {
    base: { Bangalore: 14, "Delhi NCR": 12, Mumbai: 13, Hyderabad: 12.5 },
    multiplier: { "0-2": 1.0, "3-5": 1.6, "6-10": 2.5, "10+": 4.0 },
  },
};

// ── Salary helpers ────────────────────────────────────────────────
export const getRoles       = () => Object.keys(salaryData);
export const getLocations   = () => Object.keys(salaryData["Data Scientist"].base);
export const getExperiences = () => Object.keys(salaryData["Data Scientist"].multiplier);

export function getSalaryRange(role, location, experience) {
  if (!salaryData[role]) return { min: 0, max: 0, median: 0 };
  const base = salaryData[role].base[location] || 10;
  const mult = salaryData[role].multiplier[experience] || 1.0;
  const rawBase = base * mult;
  return {
    min:    (rawBase * 0.85).toFixed(1),
    max:    (rawBase * 1.25).toFixed(1),
    median: rawBase.toFixed(1),
  };
}

// ── Course matcher (overlap-based) ────────────────────────────────
function getOverlap(arr1, arr2) {
  if (!arr1 || !arr2) return 0;
  return arr1.filter((item) => arr2.includes(item)).length;
}

export function getCourseMatch(tags) {
  if (!tags || tags.length === 0) return courses[0];
  let best = courses[0];
  let high = -1;
  for (const c of courses) {
    const score = getOverlap(c.domain_tags, tags);
    if (score > high) { high = score; best = c; }
  }
  return best;
}
