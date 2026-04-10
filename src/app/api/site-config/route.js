import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

const CONFIG_KEY = 'global';

export async function GET() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('site_config')
      .select('sidebar_widgets, homepage_hero, updated_at, updated_by')
      .eq('key', CONFIG_KEY)
      .single();

    if (error) throw error;
    return NextResponse.json(data ?? { sidebar_widgets: [], homepage_hero: {} });
  } catch (err) {
    console.error('GET /api/site-config:', err);
    return NextResponse.json({ sidebar_widgets: [], homepage_hero: {} });
  }
}

export async function PUT(request) {
  try {
    // Require an authenticated session
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = getServiceClient();
    const { error } = await db.from('site_config').upsert(
      {
        key: CONFIG_KEY,
        sidebar_widgets: Array.isArray(body.sidebar_widgets) ? body.sidebar_widgets : [],
        homepage_hero:
          body.homepage_hero && typeof body.homepage_hero === 'object'
            ? body.homepage_hero
            : {},
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
