import { Suspense } from "react";
import { getPosts } from "@/lib/data.server";
import { getSiteConfig } from "@/lib/site-config.server";
import { ToastProvider } from "@/components/Toast";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

/**
 * Dynamic Homepage (Server Component)
 * Fetches layout configuration and blog posts server-side.
 */
export default async function Home() {
  // Fetch site configuration and posts in parallel for performance
  const [posts, siteConfig] = await Promise.all([
    getPosts(),
    getSiteConfig(),
  ]);

  const homepageWidgets = siteConfig?.zones?.homepage || [];

  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0b1326]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-on-surface-variant dark:text-[#c2c6d6]">Loading content…</span>
          </div>
        </div>
      }>
        <HomeClient initialPosts={posts} homepageWidgets={homepageWidgets} />
      </Suspense>
    </ToastProvider>
  );
}
