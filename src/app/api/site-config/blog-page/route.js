import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * Public: returns the /blog page config (featured posts + carousels).
 * Read-only endpoint — mutations go through updateBlogPageConfigAction.
 */
export async function GET() {
  try {
    const db = getServiceClient();
    const { data } = await db
      .from("site_config")
      .select("zones")
      .eq("key", "global")
      .maybeSingle();

    const bp = data?.zones?.blog_page || {};
    return NextResponse.json({
      featured_slugs: Array.isArray(bp.featured_slugs) ? bp.featured_slugs : [],
      carousels:      Array.isArray(bp.carousels) ? bp.carousels : [],
    });
  } catch {
    return NextResponse.json({ featured_slugs: [], carousels: [] });
  }
}
