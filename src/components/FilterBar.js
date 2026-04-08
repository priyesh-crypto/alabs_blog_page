"use client";

import { FILTER_CHIPS, SKILL_LEVELS, TOPIC_OPTIONS } from "@/lib/config";

/**
 * Search bar + topic/skill dropdowns + filter chips.
 * Reused on homepage and blog listing page.
 *
 * @param {{
 *   searchQuery: string,
 *   onSearch: (val:string)=>void,
 *   activeTopic: string|null,
 *   onTopicSelect: (topic:string)=>void,
 *   activeSkill: string,
 *   onSkillSelect: (skill:string)=>void,
 *   onClearAll: ()=>void,
 *   topicsOpen: boolean,
 *   onToggleTopics: ()=>void,
 *   skillsOpen: boolean,
 *   onToggleSkills: ()=>void,
 * }} props
 */
export default function FilterBar({
  searchQuery,
  onSearch,
  activeTopic,
  onTopicSelect,
  activeSkill,
  onSkillSelect,
  onClearAll,
  topicsOpen,
  onToggleTopics,
  skillsOpen,
  onToggleSkills,
}) {
  const hasActiveFilters = activeTopic || activeSkill !== "All" || searchQuery;

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search insights using semantic queries..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl outline-none bg-surface-container-low dark:bg-[#131b2e] dark:text-[#dae2fd] border border-outline-variant/20 dark:border-[#424754] focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Topics dropdown */}
        <div className="relative">
          <button
            onClick={onToggleTopics}
            className="glass-dropdown flex items-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold"
          >
            Topics{" "}
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          {topicsOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 rounded-xl shadow-xl z-30 overflow-hidden border bg-surface-container-lowest dark:bg-[#171f33] border-outline-variant/20 dark:border-[#424754]">
              {TOPIC_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => onTopicSelect(t)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd] ${
                    activeTopic === t ? "text-primary dark:text-[#adc6ff] font-bold" : ""
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skill Level dropdown */}
        <div className="relative">
          <button
            onClick={onToggleSkills}
            className="glass-dropdown flex items-center gap-2 px-4 py-3 text-sm rounded-xl font-semibold"
          >
            Skill Level{" "}
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          {skillsOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-xl shadow-xl z-30 overflow-hidden border bg-surface-container-lowest dark:bg-[#171f33] border-outline-variant/20 dark:border-[#424754]">
              {SKILL_LEVELS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSkillSelect(s)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-container-low dark:hover:bg-[#222a3d] dark:text-[#dae2fd] ${
                    activeSkill === s ? "text-primary dark:text-[#adc6ff] font-bold" : ""
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="px-4 py-3 text-sm rounded-xl border border-outline-variant/20 dark:border-[#424754] text-on-surface-variant dark:text-[#c2c6d6] hover:border-primary/40 transition-colors"
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onTopicSelect(chip)}
            className={`glass-chip px-4 py-1.5 rounded-full text-sm font-semibold ${
              activeTopic === chip ? "active" : ""
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </>
  );
}
