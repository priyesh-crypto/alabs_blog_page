"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const categories = [
  { label: "Data Science", href: "/" },
  { label: "Machine Learning", href: "/" },
  { label: "AI", href: "/" },
  { label: "Analytics", href: "/" },
  { label: "Deep Learning", href: "/" },
  { label: "Salary Hub", href: "/salary-hub" },
];

export default function Navbar({ activeCategory = "Data Science" }) {
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(16);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }

    const storedFont = localStorage.getItem("font-scale");
    if (storedFont) {
      const parsed = Number(storedFont);
      setFontScale(parsed);
      document.documentElement.style.fontSize = `${parsed}px`;
    }
  }, []);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function adjustFont(amount) {
    setFontScale((prev) => {
      const next = Math.max(14, Math.min(prev + amount, 20)); // clamp between 14px and 20px
      document.documentElement.style.fontSize = `${next}px`;
      localStorage.setItem("font-scale", next);
      return next;
    });
  }

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm" id="main-nav">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="AnalytixLabs" width={140} height={32} priority style={{ objectFit: "contain" }} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={`font-[family-name:var(--font-headline)] font-bold text-sm tracking-tight transition-colors ${
                  cat.label === activeCategory
                    ? "text-[#003b93] dark:text-[#adc6ff] border-b-2 border-[#003b93] dark:border-[#adc6ff] pb-1"
                    : "text-[#434653] dark:text-[#c2c6d6] hover:text-[#003b93] dark:hover:text-[#dae2fd]"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 hover:bg-slate-100/50 dark:hover:bg-[#2d3449]/50 rounded-lg transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[#434653] dark:text-[#c2c6d6]">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>

            {/* Font scaling */}
            <div className="hidden md:flex items-center bg-surface-container-low dark:bg-[#131b2e] rounded-lg border border-outline-variant/30 dark:border-[#424754]">
              <button
                className="px-2 py-1 text-xs font-bold font-[family-name:var(--font-headline)] text-[#434653] dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
                onClick={() => adjustFont(-1)}
                aria-label="Decrease font size"
              >
                A-
              </button>
              <div className="w-[1px] h-4 bg-outline-variant/30 dark:bg-[#424754]" />
              <button
                className="px-2 py-1 text-sm font-bold font-[family-name:var(--font-headline)] text-[#434653] dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] transition-colors"
                onClick={() => adjustFont(1)}
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              className="p-2 hover:bg-slate-100/50 dark:hover:bg-[#2d3449]/50 rounded-lg transition-all"
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              id="dark-mode-toggle"
            >
              <span className="material-symbols-outlined text-[#434653] dark:text-[#c2c6d6]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* User avatar */}
            <button className="w-8 h-8 rounded-full bg-primary/10 dark:bg-[#adc6ff]/15 flex items-center justify-center border border-outline-variant/30 dark:border-[#424754] hover:bg-primary/20 dark:hover:bg-[#adc6ff]/25 transition-colors">
              <span className="material-symbols-outlined text-primary dark:text-[#adc6ff] text-lg">
                account_circle
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[4px] z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 z-[46] bg-white dark:bg-[#131b2e] transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden overflow-y-auto p-8`}
      >
        <Link href="/" className="block mb-8">
          <Image src="/logo.svg" alt="AnalytixLabs" width={120} height={28} style={{ objectFit: "contain" }} />
        </Link>
        <nav className="flex flex-col gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`font-[family-name:var(--font-headline)] font-bold text-sm ${
                cat.label === activeCategory
                  ? "text-[#003b93] dark:text-[#adc6ff]"
                  : "text-[#434653] dark:text-[#c2c6d6]"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-outline-variant/20 dark:border-[#424754]/30">
          <p className="text-sm font-bold font-[family-name:var(--font-label)] uppercase tracking-wider text-secondary dark:text-[#8c909f] mb-4">
            Accessibility
          </p>
          <div className="flex items-center gap-4 bg-surface-container-low dark:bg-[#060e20] p-1 rounded-lg border border-outline-variant/30 dark:border-[#424754] w-fit">
            <button
              className="px-4 py-2 text-sm font-bold font-[family-name:var(--font-headline)] text-[#434653] dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              onClick={() => adjustFont(-1)}
              aria-label="Decrease font size"
            >
              A-
            </button>
            <div className="w-[1px] h-6 bg-outline-variant/30 dark:bg-[#424754]" />
            <button
              className="px-4 py-2 text-lg font-bold font-[family-name:var(--font-headline)] text-[#434653] dark:text-[#c2c6d6] hover:text-primary dark:hover:text-[#adc6ff] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              onClick={() => adjustFont(1)}
              aria-label="Increase font size"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
