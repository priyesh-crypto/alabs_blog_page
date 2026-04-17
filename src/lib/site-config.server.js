/**
 * Server-only utility for fetching the global site configuration.
 * Import only in Server Components or API routes — never in "use client" files.
 */
import { getServiceClient } from './supabase';
import { SALARY_PREVIEW_ROWS } from './config';

const DEFAULT_ARTICLE_SIDEBAR = [
  {
    id: 'w-ask-ai',
    type: 'ask_ai',
    enabled: true,
    label: 'Ask the AI',
    config: {},
  },
  {
    id: 'w-recommended',
    type: 'recommended_posts',
    enabled: true,
    label: 'Recommended Articles',
    config: { count: 3 },
  },
  {
    id: 'w-author',
    type: 'author_spotlight',
    enabled: true,
    label: 'Author Spotlight',
    config: { use_article_author: true },
  },
  {
    id: 'w-salary',
    type: 'salary_table',
    enabled: true,
    label: 'India DS Salaries',
    config: {
      title: 'India DS Salaries',
      rows: SALARY_PREVIEW_ROWS.map(r => ({
        role: r.role,
        range: r.range,
        meta: r.meta,
        badge: r.badge || '',
      })),
      cta_label: 'Full Salary Report + Calculator →',
      cta_url: '/salary-hub',
    },
  },
  {
    id: 'w-course',
    type: 'course_card',
    enabled: true,
    label: 'Recommended Course',
    config: {
      use_article_match: true,
      fallback_title: 'Data Science Master Program',
      fallback_duration: '6 months',
      fallback_rating: 4.8,
      cta_label: 'Enroll Now →',
      cta_url: '',
    },
  },
];

const DEFAULT_HOMEPAGE_WIDGETS = [
  {
    id: 'hp-posts',
    type: 'posts_grid',
    enabled: true,
    label: 'Recent Blog Posts',
    config: { title: 'Recent Blog Posts' },
  },
  {
    id: 'hp-newsletter',
    type: 'newsletter_section',
    enabled: true,
    label: 'Weekly Data Science Digest',
    config: {},
  },
  {
    id: 'hp-courses',
    type: 'courses_grid',
    enabled: true,
    label: 'Featured Courses',
    config: {},
  },
];


const DEFAULT_BLOG_PAGE = {
  featured_slugs: [],
  carousels: [],
};

export const DEFAULT_ZONES = {
  article_sidebar: DEFAULT_ARTICLE_SIDEBAR,
  homepage: DEFAULT_HOMEPAGE_WIDGETS,
  course_page: [],
  global_footer: [],
  blog_page: DEFAULT_BLOG_PAGE,
};

/**
 * Fetch the global site config from Supabase.
 * Returns a `zones` dict keyed by zone name.
 * Falls back to DEFAULT_ZONES if the table is empty or unavailable.
 */
export async function getSiteConfig() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('site_config')
      .select('zones, updated_at, updated_by')
      .eq('key', 'global')
      .single();

    if (error) throw error;

    const rawZones = data?.zones;
    const homepageRaw = (rawZones && Array.isArray(rawZones.homepage) && rawZones.homepage.length > 0) 
        ? rawZones.homepage 
        : DEFAULT_HOMEPAGE_WIDGETS;

    const rawBlog = rawZones?.blog_page;
    const zones = {
        article_sidebar: (rawZones && Array.isArray(rawZones.article_sidebar) && rawZones.article_sidebar.length > 0) ? rawZones.article_sidebar : DEFAULT_ARTICLE_SIDEBAR,
        homepage:        homepageRaw,
        course_page:     (rawZones && Array.isArray(rawZones.course_page)) ? rawZones.course_page : [],
        global_footer:   (rawZones && Array.isArray(rawZones.global_footer)) ? rawZones.global_footer : [],
        blog_page: {
          featured_slugs: Array.isArray(rawBlog?.featured_slugs) ? rawBlog.featured_slugs : [],
          carousels:      Array.isArray(rawBlog?.carousels) ? rawBlog.carousels : [],
        },
    };

    // Safety Net: Ensure 'homepage' ALWAYS contains a 'posts_grid' widget
    if (!zones.homepage.some(w => w.type === 'posts_grid')) {
        zones.homepage = [
            { id: 'safety-posts', type: 'posts_grid', enabled: true, config: { title: 'Recent Blog Posts' } },
            ...zones.homepage
        ];
    }

    return {
      zones,
      updatedAt: data?.updated_at ?? '',
      updatedBy: data?.updated_by ?? '',
    };
  } catch {
    return {
      zones: DEFAULT_ZONES,
      updatedAt: '',
      updatedBy: '',
    };
  }
}
