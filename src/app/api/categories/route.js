import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from('posts')
    .select('category')
    .not('category', 'is', null)
    .neq('category', '');

  if (error) return NextResponse.json([], { status: 200 });

  const unique = [...new Set((data || []).map((r) => r.category).filter(Boolean))].sort();
  return NextResponse.json(unique);
}
