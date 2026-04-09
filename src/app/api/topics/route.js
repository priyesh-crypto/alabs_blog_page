import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from('site_config')
    .select('value')
    .eq('key', 'topics')
    .single();

  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(Array.isArray(data?.value) ? data.value : []);
}
