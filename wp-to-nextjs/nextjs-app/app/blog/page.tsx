import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPaginatedPosts, getAllCategories } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  robots: { index: false, follow: false },
};

function PaginationLink({
  page,
  label,
  active,
  disabled,
}: {
  page: number;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm text-gray-400 bg-gray-100">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={`/blog?page=${page}`}
      className={`inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-3 text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white font-semibold"
          : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { posts, total, totalPages, currentPage } = getPaginatedPosts(page);
  const categories = getAllCategories().slice(0, 24);
  const pageNums = getPageNumbers(currentPage, totalPages);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Blog
        </h1>
        <p className="mt-2 text-gray-600">
          {total} article{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
              className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

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

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2">
          <PaginationLink
            page={currentPage - 1}
            label="← Previous"
            disabled={currentPage <= 1}
          />
          {pageNums.map((n, i) =>
            n === "..." ? (
              <span
                key={`dots-${i}`}
                className="inline-flex h-10 min-w-[2.5rem] items-center justify-center text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <PaginationLink
                key={n}
                page={n}
                label={String(n)}
                active={n === currentPage}
              />
            )
          )}
          <PaginationLink
            page={currentPage + 1}
            label="Next →"
            disabled={currentPage >= totalPages}
          />
        </nav>
      )}
    </main>
  );
}
