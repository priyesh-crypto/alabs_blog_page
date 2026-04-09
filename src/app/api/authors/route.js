import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  // Require auth — author list is studio-only
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('authors')
    .select('slug, name, initials, image, email, is_super_admin')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
