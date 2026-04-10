import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'global';

const DEFAULT_ZONES = {
  article_sidebar: [],
  homepage: [],
  course_page: [],
  global_footer: [],
};

function normalizeZones(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_ZONES;
  return {
    article_sidebar: Array.isArray(raw.article_sidebar) ? raw.article_sidebar : [],
    homepage:        Array.isArray(raw.homepage)        ? raw.homepage        : [],
    course_page:     Array.isArray(raw.course_page)     ? raw.course_page     : [],
    global_footer:   Array.isArray(raw.global_footer)   ? raw.global_footer   : [],
  };
}

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: CONFIG_KEY }
    });

    if (!config) {
      return NextResponse.json({ zones: DEFAULT_ZONES, updated_at: '', updated_by: '' });
    }

    const zones = normalizeZones(config.layoutZones);

    return NextResponse.json({
      zones,
      updated_at: config.updatedAt ?? '',
      updated_by: config.updatedBy ?? '',
    });
  } catch (error) {
    console.error('GET /api/site-config error:', error);
    return NextResponse.json({ zones: DEFAULT_ZONES, updated_at: '', updated_by: '' });
  }
}

export async function PUT(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse body ────────────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body is not valid JSON' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Payload must be a JSON object' }, { status: 400 });
    }

    const zones = normalizeZones(body.zones);

    // ── Prisma Upsert ──────────────────────────────────────────────
    // Implementing robust upsert logic as per requirements
    const config = await prisma.siteConfig.upsert({
      where: { id: CONFIG_KEY },
      update: {
        layoutZones: zones,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email ?? user.id,
      },
      create: {
        id: CONFIG_KEY,
        layoutZones: zones,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email ?? user.id,
      },
    });

    console.log('Successfully updated site-config via Prisma:', config.id);
    return NextResponse.json({ success: true, data: config });

  } catch (error) {
    // ── Robust Error Boundary Logging ─────────────────────────────
    // Logging to server terminal for clear debugging
    console.error('CRITICAL API ERROR in /api/site-config:', error);

    // Returning exact error message to client as requested
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }, 
      { status: 500 }
    );
  }
}

/**
 * NOTE TO DEVELOPER: 
 * If you see an error about missing tables or columns, you MUST run:
 * npx prisma db push
 * This will synchronize your database schema with prisma/schema.prisma.
 */
