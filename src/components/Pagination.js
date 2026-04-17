"use client";

/**
 * Reusable pagination component.
 * Shows: [← Prev] [1] ... [current-1] [current] [current+1] ... [last] [Next →]
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  const btnBase =
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors border";
  const btnIdle =
    "bg-white dark:bg-[#131b2e] text-on-surface-variant dark:text-[#c2c6d6] border-outline-variant/30 dark:border-[#424754] hover:border-primary/40 hover:text-primary dark:hover:text-[#adc6ff]";
  const btnActive =
    "bg-primary text-white border-primary font-bold dark:bg-[#003b93]";
  const btnDisabled =
    "bg-gray-50 dark:bg-[#0b1326] text-gray-300 dark:text-[#424754] border-gray-100 dark:border-[#2d3449] cursor-not-allowed";

  return (
    <nav
      className={`flex items-center justify-center gap-2 flex-wrap ${className}`}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} ${currentPage <= 1 ? btnDisabled : btnIdle}`}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            className="inline-flex h-9 min-w-[2.25rem] items-center justify-center text-sm text-on-surface-variant dark:text-[#8c909f]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnIdle}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} ${currentPage >= totalPages ? btnDisabled : btnIdle}`}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
