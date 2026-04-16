import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  getAllSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import type { PostMeta } from "@/lib/posts";

/* ---------- static params ---------- */

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ---------- metadata ---------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: post.author ? [post.author] : undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
    ...(post.canonical ? { alternates: { canonical: post.canonical } } : {}),
  };
}

/* ---------- MDX components ---------- */

function MdxImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <Image
      src={props.src ?? ""}
      alt={props.alt ?? ""}
      width={800}
      height={450}
      className="rounded-lg object-cover"
    />
  );
}

function MdxLink(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }
) {
  const href = props.href ?? "";
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} className={props.className}>
        {props.children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={props.className}>
      {props.children}
    </a>
  );
}

function MdxTable(props: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}

const mdxComponents = {
  img: MdxImage,
  a: MdxLink,
  table: MdxTable,
};

/* ---------- related post card ---------- */

function RelatedCard({ post }: { post: PostMeta }) {
  return (
    <Link
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
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {post.title}
        </h3>
        <time className="mt-1 block text-xs text-gray-400">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
    </Link>
  );
}

/* ---------- page ---------- */

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(params.slug, 4);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Featured image */}
      {post.featuredImage && (
        <div className="mb-8 aspect-video overflow-hidden rounded-xl">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={1200}
            height={675}
            priority
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Category badges */}
      {post.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${cat.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-200"
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {post.title}
      </h1>

      {/* Author & date */}
      <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
        {post.author && <span>{post.author}</span>}
        {post.author && post.date && <span>·</span>}
        {post.date && (
          <time>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      {/* Content */}
      <article className="prose prose-lg prose-gray mt-10 max-w-none">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
            },
          }}
        />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-200 pt-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Related Posts
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <RelatedCard key={r.slug} post={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
