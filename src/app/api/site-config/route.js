import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'global';

const DEFAULT_ZONES = {
  article_sidebar: [],
  homepage: [],
  course_page: [],
  global_footer: [],
};

export async function GET() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('site_config')
      .select('zones, updated_at, updated_by')
      .eq('key', CONFIG_KEY)
      .single();

    if (error) throw error;
    return NextResponse.json({
      zones: data?.zones ?? DEFAULT_ZONES,
      updated_at: data?.updated_at ?? '',
      updated_by: data?.updated_by ?? '',
    });
  } catch (err) {
    console.error('GET /api/site-config:', err);
    return NextResponse.json({ zones: DEFAULT_ZONES, updated_at: '', updated_by: '' });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Accept either a full zones dict or a partial one; merge with defaults
    const zones = body.zones && typeof body.zones === 'object'
      ? { ...DEFAULT_ZONES, ...body.zones }
      : DEFAULT_ZONES;

    const db = getServiceClient();
    const { error } = await db.from('site_config').upsert(
      {
        key: CONFIG_KEY,
        zones,
        updated_at: new Date().toISOString(),
        updated_by: user.email ?? user.id,
      },
      { onConflict: 'key' }
    );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/site-config:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
