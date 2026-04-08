import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServiceClient } from '@/lib/supabase';

/**
 * ONE-TIME admin recovery endpoint.
 * Call GET /api/admin-setup while logged in as the super admin email.
 * Grants is_super_admin = true for your account, creating the authors row if needed.
 * Protected: only works if your session email matches SUPER_ADMIN_EMAIL env var.
 */
export async function GET() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    return NextResponse.json(
      { error: 'SUPER_ADMIN_EMAIL env var not set.' },
      { status: 503 }
    );
  }

  // Verify the caller is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated. Please log in first.' }, { status: 401 });
  }

  // Only the designated super admin email can use this endpoint
  if (user.email?.toLowerCase() !== superAdminEmail.toLowerCase()) {
    return NextResponse.json(
      { error: `Access denied. This endpoint is reserved for ${superAdminEmail}.` },
      { status: 403 }
    );
  }

  const db = getServiceClient();
  const normalizedEmail = user.email.toLowerCase();

  // Check if an authors row already exists for this email
  const { data: existing } = await db
    .from('authors')
    .select('slug, name, is_super_admin')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    // Row exists — just flip the flag
    const { error } = await db
      .from('authors')
      .update({ is_super_admin: true })
      .ilike('email', normalizedEmail);

    if (error) {
      console.error('admin-setup update failed:', error);
      return NextResponse.json({ error: 'DB update failed: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Super admin flag set for existing author "${existing.name}" (${normalizedEmail}).`,
      was_admin: existing.is_super_admin,
    });
  }

  // No row — create one from Supabase auth metadata
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || normalizedEmail.split('@')[0];
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-admin';

  const { error: insertErr } = await db.from('authors').insert({
    slug,
    name: displayName,
    email: normalizedEmail,
    is_super_admin: true,
    initials,
    color: '#0f2554',
  });

  if (insertErr) {
    console.error('admin-setup insert failed:', insertErr);
    return NextResponse.json({ error: 'DB insert failed: ' + insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Author row created and super admin flag set for "${displayName}" (${normalizedEmail}).`,
    slug,
  });
}
