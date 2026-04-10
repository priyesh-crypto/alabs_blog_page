"use client";

import Link from "next/link";
import { SALARY_PREVIEW_ROWS } from "@/lib/config";

/**
 * Sidebar salary teaser widget.
 *
 * @param {{ config?: { title?: string, rows?: Array, cta_label?: string, cta_url?: string } }} props
 * When `config` is omitted the component falls back to the static SALARY_PREVIEW_ROWS from lib/config.
 */
export default function SidebarSalaryWidget({ config }) {
  const title    = config?.title    || `India DS Salaries ${new Date().getFullYear()}`;
  const rows     = config?.rows?.length ? config.rows : SALARY_PREVIEW_ROWS;
  const ctaLabel = config?.cta_label || "Full Salary Report + Calculator →";
  const ctaUrl   = config?.cta_url   || "/salary-hub";

  return (
    <div className="rounded-2xl border p-5 bg-white dark:bg-[#0b1326] border-outline-variant/10 dark:border-[#424754] shadow-sm">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] mb-5">
        {title}
      </span>
      <div className="flex flex-col divide-y divide-outline-variant/10 dark:divide-[#424754]/40">
        {rows.map(({ role, range, meta, badge }) => (
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
        href={ctaUrl}
        className="block w-full mt-5 py-3 rounded-2xl text-sm font-bold text-center text-white transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#4C7FD2 57%,#27416C 100%)" }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
