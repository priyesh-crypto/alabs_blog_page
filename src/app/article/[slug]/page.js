import { redirect } from 'next/navigation';

export default async function ArticleRedirect({ params }) {
  const resolvedParams = await params;
  redirect(`/blog/${resolvedParams.slug}`);
}
