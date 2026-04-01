import { redirect } from "next/navigation";
import { getPosts } from "@/lib/data";

export default function ArticlePage() {
  const posts = getPosts();
  redirect(`/article/${posts[0].slug}`);
}
