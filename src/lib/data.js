export const authors = {
  "s-dutta": {
    slug: "s-dutta",
    name: "S. Dutta",
    initials: "SD",
    color: "bg-primary-container",
    bio: "Senior Data Scientist with 10+ years experience in probabilistic modeling and quantitative finance.",
    linkedin: "https://linkedin.com/in/sdutta-mock",
    expertise: ["Statistics", "Machine Learning", "Bayesian Inference"],
    experience: "10 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAMr60OXqV8zI3Zk0C0ETUOloQaTtAXKObnroPkmQdBL29_hVyUdJ-LSpSMGeYarlq66xkm4Z2MA3h-7o-vlqf7wM3m_3eAspRDpqzPgAu4eiiGgNXkj1UZEh-BCEdP7eAlO4lvBrV0t6bHKOrEUtbma5CaVChapJWGIPz8r3mepo-RZwhhqAlgITBPNu8St4Ko8WmG_u9QTbPqR6H-PnvImPZqflWN_PTxmYHqbVwdsdXfaU9FHf7ByKii_EAbmhKkyuZCkxf18lmS",
  },
  "a-kapoor": {
    slug: "a-kapoor",
    name: "A. Kapoor",
    initials: "AK",
    color: "bg-tertiary-container",
    bio: "Lead AI Engineer building high-throughput ML pipelines and scalable vector similarity infrastructure.",
    linkedin: "https://linkedin.com/in/akapoor-mock",
    expertise: ["Data Engineering", "Vector Databases", "MLOps"],
    experience: "7 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqbmACZVEBM4Y4qOv1IIUcz17R6_yLTz9ipnfQoZQktUZXYK0sGC5gP7okIqdq-37FayoBWmrTZvwSSPJYUfXEjMvQH3TsLFnvXYb_nPl-cTo1XDIDndpx2C6jKPZYXtq369tEZOfJrQldj-qAdIZR07jRGFVvdmTLHM3CfaKXsrOWkGwx_gFbMJmlCONTSnLccG_AIjG9XlI3T16B_wgKWIZbI7JGq0KbFEEgjkVfqM7vhtpSmf2yJxQFdPGZzec0CBE2asckyogV",
  },
  "r-long": {
    slug: "r-long",
    name: "R. Long",
    initials: "RL",
    color: "bg-secondary-fixed",
    bio: "AI Researcher focusing on prompt engineering, safety alignments, and deterministic generation.",
    linkedin: "https://linkedin.com/in/rlong-mock",
    expertise: ["Generative AI", "Prompt Engineering"],
    experience: "5 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0-4I2p4D7_DV8w8c-ChPKLcxGj3rQV_UciKqavuQFAkQeVjO29CuIhMKEHouka2KQQMGcyTgp7OOBFTn7k3VmsfhWbDE_q2DZn5P2nY27vFb2qyS4gbv_CEQsheGIdQzl8NQPXNMzqos59jNdacWdbC4zs1_Ow3ccdw-B3Ij5t-JriFYtteDLXb3Mg-MG2N2CKBm1UBX_tBtV5qwaGRK9Syl4Yg4exf_MvcWhLMzxd4K6T8YN0Ao2JgqgeLCpWG7jvOX3Lojt3wUp",
  },
  "al-editorial": {
    slug: "al-editorial",
    name: "AL Labs Editorial",
    initials: "AL",
    color: "bg-primary",
    bio: "The AnalytixLabs internal writing team, curating the best in data science education.",
    linkedin: "https://linkedin.com/company/analytixlabs",
    expertise: ["Data Science Education", "Career Advice"],
    experience: "12 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWH0-iy0YexEmNgbb6xT4xV9b6GsoFnY_9aUMH6fTFAQclaeR3Q3aaUejHYtdNeoOUCTHo8msFSglbimLSEzN8cRXBVovh6XHhCo8N7AGOkSGG7g42Soi0OGcBxTncG9BuB7d3Q885lglT_5HxweffsUakx3AzCrpMIEhhDwPn5bNo8LmtHlY3K0HomYlDlJZ_6y4dfViCcAmAEtc4Uji5B7X82cLIVqrEJZuSbAuamU0ZRAZZl5bXiz7fveiMJcorj_U3ODpBe3kQ",
  },
  "aris-thorne": {
    slug: "aris-thorne",
    name: "Dr. Aris Thorne",
    initials: "AT",
    color: "bg-primary-container",
    bio: "Chief ML Architect. Aris leads the AI research division at AnalytixLabs with over 15 years in predictive modeling and neural architecture search.",
    linkedin: "https://linkedin.com/in/aris-thorne",
    expertise: ["Neural Architecture", "Transformers", "Deep Learning"],
    experience: "15 Years",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRG-_Ndw0YrduOsgmsEJX_Jm6TR75Ghzm5RN42hzi5WzxAtIWIMEmQWKMhxdA2yLswwhqDOOt5qWJvLsRRcZ1KFCxAWb7559VQIkaC5hFUjsKiQ_lq33vk-a-nRYYkIoXe30BuU8B6HIhXbsgE7eUNcrpzEvnl4QHQNSUYsY-tn5MvhnDXDVwQKmYyw_YWkOVOO5RSEpGsI0zdiNdkAOlNxZERYHt34IrTHdrZc7QKenh9t4Yxcx3Kvkxbht8V-qBJqfwXHIYWftur",
  }
};

import blogPostsData from './posts.json';

export const blogPosts = blogPostsData;

// Helper to expand authors inside posts
export const getPosts = () => blogPosts.map(p => ({ ...p, author: authors[p.authorId] }));

export const tags = [...new Set(blogPosts.flatMap(p => p.domain_tags))];
export const skillLevels = ["Beginner", "Intermediate", "Advanced"];

export const courses = [
  {
    id: "ds-spec",
    title: "Data Science Specialization",
    label: "Specialization",
    domain_tags: ["Statistics", "Python", "Machine Learning"],
    desc: "Master Python, SQL, and predictive modeling with real-world industry capstones.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh8ivFg8VBjm2zpSqFnI-3MkdXemZRSmKL2fjdyxcBS8zcU2-UO7L4MgVMkbcKU7QeMp3AqnZyLnQMcFIVIDy-nOePtrXzxxBb-dIcantQaJlGrtdaim5JYD9yWkTTplcGh1YMilpDaNpYC3dURy4WxcN0XHtCOyLrIOITJbAnk1suzP0SV1aXc6H3_N4wxno_E7HfrPo399y67upgN34RsH2sZgD2ZRpy-IB5AiUXzj8CXMgxrqdKopbcQjvx_VNVXcXoInX2wlSG",
  },
  {
    id: "ml-mastery",
    title: "Machine Learning Mastery",
    label: "Advanced",
    domain_tags: ["Deep Learning", "Generative AI", "PyTorch"],
    desc: "Deep dive into neural networks, reinforcement learning, and advanced algorithms.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwHYUYKnycf2FxVMoMCwQ1UgZgFyXDw8j_lUAbdLeOtbVyqvKgCAj_9A4FbNSI_SCYRy9wt--t0aRl_dUOO9YxKorbLZ4y6AxJFXAkA3CcgxkLwIOAXVLnNgvbeI7RaERrw0KGpDug9OZVgDwzno0OEQ6TrcqtPAgu_sHsjWmEwHiCaJtigft21XzPpMDMA8xuf2W5vW-g-36ROGFSPY7HTTEaRHDv93wFbGeaUkAS_p5GOysPBVryKY1hp_pFwOBRVP2Fwbe3Y41X",
  },
  {
    id: "ai-eng",
    title: "AI Engineering",
    label: "Engineering",
    domain_tags: ["MLOps", "Data Engineering", "Generative AI"],
    desc: "Build and deploy large-scale AI applications using modern RAG and LLM stacks.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCRG-_Ndw0YrduOsgmsEJX_Jm6TR75Ghzm5RN42hzi5WzxAtIWIMEmQWKMhxdA2yLswwhqDOOt5qWJvLsRRcZ1KFCxAWb7559VQIkaC5hFUjsKiQ_lq33vk-a-nRYYkIoXe30BuU8B6HIhXbsgE7eUNcrpzEvnl4QHQNSUYsY-tn5MvhnDXDVwQKmYyw_YWkOVOO5RSEpGsI0zdiNdkAOlNxZERYHt34IrTHdrZc7QKenh9t4Yxcx3Kvkxbht8V-qBJqfwXHIYWftur",
  },
];

export const salaryData = {
  "Data Scientist": {
    base: { "Bangalore": 12, "Delhi NCR": 10, "Mumbai": 11, "Hyderabad": 10 },
    multiplier: { "0-2": 1.0, "3-5": 1.5, "6-10": 2.2, "10+": 3.5 }
  },
  "Data Engineer": {
    base: { "Bangalore": 11, "Delhi NCR": 9, "Mumbai": 10, "Hyderabad": 9.5 },
    multiplier: { "0-2": 1.0, "3-5": 1.4, "6-10": 2.0, "10+": 3.0 }
  },
  "AI Engineer / ML Engineer": {
    base: { "Bangalore": 14, "Delhi NCR": 12, "Mumbai": 13, "Hyderabad": 12.5 },
    multiplier: { "0-2": 1.0, "3-5": 1.6, "6-10": 2.5, "10+": 4.0 }
  }
};

export const getRoles = () => Object.keys(salaryData);
export const getLocations = () => Object.keys(salaryData["Data Scientist"].base);
export const getExperiences = () => Object.keys(salaryData["Data Scientist"].multiplier);

export function getSalaryRange(role, location, experience) {
  if (!salaryData[role]) return { min: 0, max: 0, median: 0 };
  const base = salaryData[role].base[location] || 10;
  const mult = salaryData[role].multiplier[experience] || 1.0;
  const rawBase = base * mult;
  return {
    min: (rawBase * 0.85).toFixed(1),
    max: (rawBase * 1.25).toFixed(1),
    median: rawBase.toFixed(1)
  };
}

/**
 * Calculates overlap between two arrays
 */
const getOverlap = (arr1, arr2) => {
  if (!arr1 || !arr2) return 0;
  return arr1.filter(item => arr2.includes(item)).length;
};

/**
 * Returns highly similar posts based on domain tags and skill level overlap.
 */
export function getRecommendations(currentSlug, limit = 3) {
  const posts = getPosts();
  const currentPost = posts.find(p => p.slug === currentSlug);
  if (!currentPost) return posts.slice(0, limit);

  const scoredPosts = posts
    .filter(p => p.slug !== currentSlug)
    .map(p => {
      let score = getOverlap(p.domain_tags, currentPost.domain_tags) * 2;
      if (p.skill_level === currentPost.skill_level) score += 1;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scoredPosts.slice(0, limit);
}

/**
 * Perform a semantic-style fallback search matching title, excerpt, and tags.
 */
export function searchPosts(query, activeTopic = null, activeSkill = null) {
  let results = getPosts();

  if (activeTopic) {
    results = results.filter(p => p.domain_tags.includes(activeTopic) || p.category === activeTopic);
  }
  
  if (activeSkill) {
    results = results.filter(p => p.skill_level === activeSkill);
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.excerpt.toLowerCase().includes(q) ||
      p.domain_tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return results;
}

/**
 * Maps a set of domain tags to the most relevant course CTA
 */
export function getCourseMatch(tags) {
  if (!tags || tags.length === 0) return courses[0];

  let bestMatch = courses[0];
  let highestOverlap = -1;

  for (const course of courses) {
    const overlap = getOverlap(course.domain_tags, tags);
    if (overlap > highestOverlap) {
      highestOverlap = overlap;
      bestMatch = course;
    }
  }
  return bestMatch;
}
