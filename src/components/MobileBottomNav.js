"use client";

import Link from "next/link";

export default function MobileBottomNav({ activePage = "home" }) {
  const items = [
    { id: "home", icon: "home", label: "Home", href: "/" },
    { id: "insights", icon: "article", label: "Insights", href: "/" },
    { id: "courses", icon: "school", label: "Courses", href: "#courses" },
    { id: "saved", icon: "bookmark", label: "Saved", href: "#" },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`mobile-nav-item ${item.id === activePage ? "active" : ""}`}
        >
          <span
            className={`material-symbols-outlined text-xl ${
              item.id === activePage ? "filled" : ""
            }`}
          >
            {item.icon}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
