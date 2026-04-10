/**
 * Server-only utility for fetching the global site configuration.
 * Import only in Server Components or API routes — never in "use client" files.
 */
import { getServiceClient } from './supabase';
import { SALARY_PREVIEW_ROWS } from './config';

/** Mirrors the default row inserted by migration 012. Used as in-memory fallback. */
export const DEFAULT_SIDEBAR_WIDGETS = [
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

/**
 * Fetch the global site config from Supabase.
 * Falls back to DEFAULT_SIDEBAR_WIDGETS if the table is empty or unavailable.
 */
export async function getSiteConfig() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('site_config')
      .select('sidebar_widgets, homepage_hero, updated_at, updated_by')
      .eq('key', 'global')
      .single();

    if (error) throw error;

    return {
      sidebarWidgets: Array.isArray(data?.sidebar_widgets) && data.sidebar_widgets.length > 0
        ? data.sidebar_widgets
        : DEFAULT_SIDEBAR_WIDGETS,
      homepageHero: data?.homepage_hero ?? {},
      updatedAt: data?.updated_at ?? '',
      updatedBy: data?.updated_by ?? '',
    };
  } catch {
    return {
      sidebarWidgets: DEFAULT_SIDEBAR_WIDGETS,
      homepageHero: {},
      updatedAt: '',
      updatedBy: '',
    };
  }
}
