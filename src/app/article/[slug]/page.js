import { getPosts } from "@/lib/data";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const posts = getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return <ArticleContent post={post} />;
}
