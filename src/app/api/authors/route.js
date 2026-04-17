import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

/**
 * Returns the list of author profiles.
 *
 * Default (public): public profile fields only — used by the blog listing's Author Spotlight,
 *   author pages, and any anonymous visitor context.
 *
 * ?admin=true (authenticated): full fields including email + is_super_admin — used by Studio.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get('admin') === 'true';

  const db = getServiceClient();

  if (adminMode) {
    // Studio-only: full profile including email + admin flag
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await db
      .from('authors')
      .select('*')
      .order('name', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  }

  // Public: profile fields only — no email, no admin flag
  const { data, error } = await db
    .from('authors')
    .select('slug, name, initials, color, image, bio, linkedin, expertise, experience, position')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
