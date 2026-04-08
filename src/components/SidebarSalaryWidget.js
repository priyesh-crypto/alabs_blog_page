"use client";

import Link from "next/link";
import { SALARY_PREVIEW_ROWS } from "@/lib/config";

/**
 * Sidebar salary teaser widget — shows quick salary ranges with a CTA to the full Salary Hub.
 */
export default function SidebarSalaryWidget() {
  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] mb-5">
        India DS Salaries {new Date().getFullYear()}
      </span>
      <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
        {SALARY_PREVIEW_ROWS.map(({ role, range, meta, badge }) => (
          <div key={role} className="flex items-center justify-between py-3">
            <div>
              <div className="text-[13px] font-bold text-on-background dark:text-[#dae2fd] flex items-center gap-2">
                {role}
                {badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide text-white"
                    style={{ background: "linear-gradient(135deg,#4C7FD2,#27416C)" }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-on-surface-variant dark:text-[#8c909f] mt-0.5">
                {meta}
              </div>
            </div>
            <span className="text-[13px] font-bold" style={{ color: "#16a34a" }}>
              {range}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/salary-hub"
        className="block w-full mt-5 py-3 rounded-2xl text-sm font-bold text-center text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
      >
        Full Salary Report + Calculator →
      </Link>
    </div>
  );
}
