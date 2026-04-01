import { getPosts, getRecommendations, getCourseMatch } from "@/lib/data";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const posts = getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const recommendedArticles = getRecommendations(slug, 3);
  const courseMatch = getCourseMatch(post.domain_tags);
  return <ArticleContent post={post} recommendedArticles={recommendedArticles} courseMatch={courseMatch} />;
}
