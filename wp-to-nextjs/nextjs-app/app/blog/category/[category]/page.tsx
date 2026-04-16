import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllCategories, getPostsByCategory } from "@/lib/posts";

/* ---------- static params ---------- */

export function generateStaticParams() {
  return getAllCategories().map((cat) => ({
    category: cat.toLowerCase().replace(/\s+/g, "-"),
  }));
}

/* ---------- metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const name = resolvedParams.category.replace(/-/g, " ");
  return {
    title: `${name.charAt(0).toUpperCase() + name.slice(1)} Articles`,
    robots: { index: false, follow: false },
  };
}

/* ---------- page ---------- */

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const resolvedParams = await params;
  const categoryName = resolvedParams.category.replace(/-/g, " ");
  const posts = getPostsByCategory(categoryName);

  if (posts.length === 0) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        &larr; All posts
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl capitalize">
          {categoryName}
        </h1>
        <p className="mt-2 text-gray-600">
          {posts.length} article{posts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Card grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {post.featuredImage && (
              <div className="aspect-video overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  width={600}
                  height={338}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              {post.categories[0] && (
                <span className="mb-2 inline-block self-start rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                  {post.categories[0]}
                </span>
              )}
              <h2 className="mb-1 text-lg font-semibold text-gray-900 line-clamp-2">
                {post.title}
              </h2>
              {post.description && (
                <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
              )}
              <time className="mt-auto text-xs text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
