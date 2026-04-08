import { getPosts, getAuthors } from "@/lib/data.server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

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
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden relative shrink-0 border-4 border-surface-container-highest dark:border-[#131b2e] shadow-xl">
            <Image 
              src={author.image} 
              alt={author.name}
              fill
              className="object-cover"
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

        {/* Authored Posts */}
        <section>
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant/10 dark:border-[#424754]/30">
            <span className="material-symbols-outlined text-3xl text-primary dark:text-[#adc6ff]">
              article
            </span>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-headline)]">
              Published by {author.name.split(" ")[0]}
            </h2>
            <span className="ml-auto bg-surface-container-high dark:bg-[#222a3d] px-3 py-1 rounded-full text-xs font-bold">
              {authorPosts.length} Articles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {authorPosts.map((post) => (
              <Link
                key={post.id}
                className="group flex flex-col bg-surface-container-lowest dark:bg-[#131b2e] rounded-3xl overflow-hidden hover:shadow-xl dark:hover:shadow-[#060e20]/50 transition-all border border-transparent hover:border-outline-variant/20 dark:border-[#424754]/20"
                href={`/article/${post.slug}`}
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={post.image}
                    fill
                    sizes="50vw"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {post.domain_tags.slice(0, 1).map((tag) => (
                      <span
                        key={tag}
                        className="bg-white/90 dark:bg-[#0b1326]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-label)] font-bold tracking-widest uppercase text-on-surface dark:text-[#dae2fd]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-primary dark:text-[#adc6ff] font-bold">
                      {post.category}
                    </span>
                    <span className="text-slate-500 dark:text-[#c2c6d6] text-xs font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        schedule
                      </span>
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-headline)] font-bold text-xl leading-snug group-hover:text-primary dark:group-hover:text-[#adc6ff] transition-colors dark:text-[#dae2fd] mb-3">
                    {post.title}
                  </h3>
                  <p className="text-on-surface-variant dark:text-[#c2c6d6] text-sm leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <Footer />
      <MobileBottomNav activePage="home" />
    </div>
  );
}
