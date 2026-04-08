"use client";

import Link from "next/link";
import { MOBILE_NAV_ITEMS } from "@/lib/config";

export default function MobileBottomNav({ activePage = "home" }) {
  return (
    <nav className="mobile-bottom-nav">
      {MOBILE_NAV_ITEMS.map((item) => (
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
