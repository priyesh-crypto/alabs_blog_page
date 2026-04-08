import Link from "next/link";
import { SITE_NAME, COPYRIGHT_YEAR, FOOTER_LINKS } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-[#dae2fd]/15 bg-slate-50 dark:bg-[#0b1326] mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-center max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8 lg:mb-0">
          <div className="text-lg font-bold text-slate-900 dark:text-[#dae2fd] mb-2 font-[family-name:var(--font-headline)]">
            {SITE_NAME}
          </div>
          <p className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-slate-500 dark:text-[#c2c6d6]">
            © {COPYRIGHT_YEAR} {SITE_NAME}. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              className="font-[family-name:var(--font-label)] text-xs uppercase tracking-widest text-slate-500 dark:text-[#c2c6d6] hover:text-blue-700 dark:hover:text-[#ffb787] underline-offset-4 hover:underline transition-colors"
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
