import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from('courses')
    .select('id,title,label,description,image,url,duration,rating,domain_tags,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
