import { getPosts, getAuthors } from "@/lib/data.server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import AuthorPostsList from "./AuthorPostsList";

// Allow dynamic slugs not returned by generateStaticParams
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const authorsMap = await getAuthors();
    return Object.keys(authorsMap).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const authorsMap = await getAuthors();
  const author = authorsMap[slug];

  if (!author) {
    notFound();
  }

  const allPosts = await getPosts();
  const authorPosts = allPosts.filter(p => p.authorId === slug);

  return (
    <div className="min-h-screen flex flex-col pt-16 font-[family-name:var(--font-body)] bg-background dark:bg-[#0b1326] text-on-background dark:text-[#dae2fd]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        
        {/* Author Header */}
        <section className="flex flex-col md:flex-row gap-8 items-start mb-16">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden relative shrink-0 border-4 border-surface-container-highest dark:border-[#131b2e] shadow-xl bg-white dark:bg-[#131b2e]">
            <Image
              src={author.image}
              alt={author.name}
              fill
              className="object-contain p-3"
              sizes="192px"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold font-[family-name:var(--font-headline)] mb-2 tracking-tight">
              {author.name}
            </h1>
            <p className="text-xl text-primary dark:text-[#adc6ff] font-[family-name:var(--font-headline)] font-medium mb-4">
              {author.experience} Experience
            </p>
            <p className="text-on-surface-variant dark:text-[#c2c6d6] text-lg leading-relaxed max-w-2xl mb-6">
              {author.bio}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {author.expertise.map(skill => (
                <span key={skill} className="px-3 py-1 bg-secondary-container dark:bg-[#2d3449] text-on-secondary-container dark:text-[#c2c6d6] rounded-full text-xs font-[family-name:var(--font-label)] font-bold tracking-widest uppercase">
                  {skill}
                </span>
              ))}
            </div>

            <a href={author.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-lowest dark:bg-[#131b2e] border border-outline/20 hover:border-primary transition-colors rounded-full text-sm font-[family-name:var(--font-label)] font-bold shadow-sm">
              <span className="material-symbols-outlined text-primary">link</span>
              View LinkedIn Profile
            </a>
          </div>
        </section>

        {/* Authored Posts — featured + searchable + paginated */}
        <AuthorPostsList posts={authorPosts} authorName={author.name} />

      </main>

      <Footer />
      <MobileBottomNav activePage="home" />
    </div>
  );
}
