import { getPosts, getRecommendations, getCourseMatch } from "@/lib/data";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

/**
 * Extracts FAQ pairs from HTML content.
 *
 * Logic: scan every element in the post body. When a heading (h2/h3/h4)
 * or bold paragraph ends with "?", treat it as a Question. The very next
 * sibling paragraph's text becomes the Answer. These pairs are assembled
 * into a schema.org FAQPage JSON-LD block that Google uses to display
 * "People Also Ask" rich results in search.
 */
function extractFaqJsonLd(htmlContent) {
  // Parse on the server using a simple regex-based approach (no DOM available)
  const pairs = [];
  // Match heading or <p><strong>...</strong></p> patterns ending with "?"
  const questionRe = /<(?:h[2-4]|p)[^>]*>((?:<[^>]+>)*)(.*?\?)((?:<\/[^>]+>)*)<\/(?:h[2-4]|p)>/gi;
  // Split content into segments to find the paragraph after each question
  const segments = htmlContent.split(/(?=<(?:h[2-4]|p)[^>]*>)/i);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const stripped = seg.replace(/<[^>]+>/g, '').trim();
    if (!stripped.endsWith('?')) continue;
    if (stripped.length < 5) continue;

    // Find next paragraph segment for the answer
    let answer = '';
    for (let j = i + 1; j < segments.length; j++) {
      const nextStripped = segments[j].replace(/<[^>]+>/g, '').trim();
      if (nextStripped) { answer = nextStripped; break; }
    }

    if (answer) {
      pairs.push({ question: stripped, answer });
    }
  }

  if (pairs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const posts = getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const recommendedArticles = getRecommendations(slug, 3);
  const courseMatch = getCourseMatch(post.domain_tags);

  const faqJsonLd = post.discussion?.faqSchema && post.content
    ? extractFaqJsonLd(post.content)
    : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ArticleContent post={post} recommendedArticles={recommendedArticles} courseMatch={courseMatch} />
    </>
  );
}
