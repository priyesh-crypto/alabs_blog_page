"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Send,
  Layout,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  SidebarOpen,
  Home,
  GraduationCap,
  AlignJustify,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import WidgetCard from "@/components/studio/WidgetCard";
import WidgetSettingsDrawer from "@/components/studio/WidgetSettingsDrawer";

// ── Widget type registry ──────────────────────────────────────────
const WIDGET_TYPES = {
  ask_ai:            { label: "Ask the AI",           color: "#4f46e5", description: "AI assistant contextualised to the article." },
  recommended_posts: { label: "Recommended Articles", color: "#0e7490", description: "Articles recommended by domain tags." },
  author_spotlight:  { label: "Author Spotlight",     color: "#003b93", description: "Author card linked to /author/[slug]." },
  salary_table:      { label: "Salary Table",         color: "#16a34a", description: "India DS salary preview with link to /salary-hub." },
  course_card:       { label: "Course CTA",           color: "#b45309", description: "Recommended course card with enroll link." },
};

const WIDGET_DEFAULTS = {
  ask_ai:            { config: {} },
  recommended_posts: { config: { count: 3 } },
  author_spotlight:  { config: { use_article_author: true } },
  salary_table: {
    config: {
      title: "India DS Salaries",
      rows: [
        { role: "Data Scientist", range: "₹18–28 LPA", meta: "Bangalore · 3-5 yrs", badge: "" },
        { role: "ML Engineer",    range: "₹18–28 LPA", meta: "Mumbai · 2-4 yrs",    badge: "" },
        { role: "Data Analyst",   range: "₹10–20 LPA", meta: "Delhi NCR · 0-3 yrs", badge: "" },
      ],
      cta_label: "Full Salary Report + Calculator →",
      cta_url: "/salary-hub",
    },
  },
  course_card: {
    config: {
      use_article_match: true,
      fallback_title: "Data Science Master Program",
      fallback_duration: "6 months",
      fallback_rating: 4.8,
      cta_label: "Enroll Now →",
      cta_url: "",
    },
  },
};

// ── Zone definitions ─────────────────────────────────────────────
const ZONES = [
  {
    id: "article_sidebar",
    label: "Article Sidebar",
    description: "Widgets rendered in the right column on article pages.",
    Icon: SidebarOpen,
    color: "#4f46e5",
  },
  {
    id: "homepage",
    label: "Homepage",
    description: "Content blocks shown on the site homepage.",
    Icon: Home,
    color: "#0e7490",
  },
  {
    id: "course_page",
    label: "Course Page",
    description: "Widgets rendered on individual course detail pages.",
    Icon: GraduationCap,
    color: "#b45309",
  },
  {
    id: "global_footer",
    label: "Global Footer",
    description: "Content blocks displayed in the site-wide footer.",
    Icon: AlignJustify,
    color: "#16a34a",
  },
];

const EMPTY_ZONES = {
  article_sidebar: [],
  homepage: [],
  course_page: [],
  global_footer: [],
};

function newId() {
  return "w-" + Math.random().toString(36).slice(2, 9);
}

export default function SiteLayoutPage() {
  const router = useRouter();
  const { authorProfile, loading: authLoading } = useAuth();

  // Data state: zones dict
  const [zones, setZones] = useState(EMPTY_ZONES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [updatedBy, setUpdatedBy] = useState("");

  // Active zone
  const [activeZone, setActiveZone] = useState("article_sidebar");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [isNewWidget, setIsNewWidget] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!authLoading && !authorProfile) router.replace("/studio/login");
  }, [authLoading, authorProfile, router]);

  useEffect(() => {
    fetch("/api/site-config")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.zones) {
          setZones({ ...EMPTY_ZONES, ...data.zones });
          setUpdatedBy(data.updated_by || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Zone-scoped widget helpers ───────────────────────────────
  const widgets = zones[activeZone] ?? [];

  const setWidgets = (updater) => {
    setZones(prev => ({
      ...prev,
      [activeZone]: typeof updater === "function" ? updater(prev[activeZone] ?? []) : updater,
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setWidgets(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (id) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleDelete = (id) => {
    if (confirm("Remove this widget?")) {
      setWidgets(prev => prev.filter(w => w.id !== id));
    }
  };

  const handleEdit = (widget) => {
    setEditingWidget(widget);
    setIsNewWidget(false);
    setIsDrawerOpen(true);
  };

  const handleAddNew = () => {
    setEditingWidget(null);
    setIsNewWidget(true);
    setIsDrawerOpen(true);
  };

  const handleSaveWidget = (updatedWidget) => {
    if (isNewWidget) {
      const defaults = WIDGET_DEFAULTS[updatedWidget.type] || { config: {} };
      const newWidget = {
        ...updatedWidget,
        id: newId(),
        config: { ...defaults.config, ...updatedWidget.config },
      };
      setWidgets(prev => [...prev, newWidget]);
    } else {
      setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
    }
    setIsDrawerOpen(false);
  };

  const saveLayout = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zones }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "ok", text: "Layout saved. Changes are live." });
        setUpdatedBy(authorProfile?.name || "you");
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: "err", text: data.error || "Save failed." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-surface)]">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin mb-4" />
        <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">Loading layout settings…</span>
      </div>
    );
  }

  const activeZoneMeta = ZONES.find(z => z.id === activeZone);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/studio")}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                Site Layout
                <span className="text-[10px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-2 py-0.5 rounded-full uppercase tracking-wider">Editor</span>
              </h1>
              {updatedBy && (
                <p className="text-[10px] text-[var(--color-on-surface-variant)]">Last saved by {updatedBy}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/studio")}
              className="hidden sm:block px-4 py-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-black/5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveLayout}
              disabled={saving}
              className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Publish Changes
            </button>
          </div>
        </div>
      </header>

      {/* 2-column layout */}
      <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-73px)]">
        {/* ── Left Zone Nav ─────────────────────────────────── */}
        <aside className="w-[250px] shrink-0 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface)] py-8 px-4">
          <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-4 ml-2">
            Zones
          </p>
          <nav className="space-y-1">
            {ZONES.map(({ id, label, Icon, color }) => {
              const isActive = id === activeZone;
              const count = (zones[id] ?? []).filter(w => w.enabled).length;
              return (
                <button
                  key={id}
                  onClick={() => setActiveZone(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white font-bold shadow-md"
                      : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] font-medium"
                  }`}
                >
                  <Icon size={17} style={{ color: isActive ? "white" : color }} />
                  <span className="flex-1 text-sm">{label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-primary-container)]/30 text-[var(--color-primary)]"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Right Canvas ──────────────────────────────────── */}
        <main className="flex-1 px-8 py-8 pb-24 overflow-y-auto">
          {/* Toast */}
          {message && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border shadow-sm animate-in slide-in-from-top duration-300 ${
              message.type === "ok"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {message.type === "ok" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Zone header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                {activeZoneMeta?.Icon && (
                  <activeZoneMeta.Icon size={20} style={{ color: activeZoneMeta.color }} />
                )}
                {activeZoneMeta?.label}
              </h2>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                {activeZoneMeta?.description}
              </p>
            </div>
            <p className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-container)]/20 px-3 py-1 rounded-full">
              {widgets.filter(w => w.enabled).length} Active
            </p>
          </div>

          {/* Widget list */}
          <div className="space-y-3 max-w-xl">
            {widgets.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-outline-variant)] rounded-3xl bg-[var(--color-surface-container-low)]">
                <div className="w-16 h-16 bg-[var(--color-surface-container-highest)] rounded-full flex items-center justify-center mb-4">
                  <Layout size={32} className="text-[var(--color-on-surface-variant)] opacity-40" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">No widgets yet</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] text-center max-w-[240px] mt-2 mb-8 leading-relaxed">
                  Add your first widget to populate this zone.
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-2xl font-bold flex items-center gap-2 hover:shadow-xl hover:shadow-[var(--color-primary)]/20 active:scale-95 transition-all"
                >
                  <Plus size={20} />
                  Add Your First Widget
                </button>
              </div>
            ) : (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={widgets.map(w => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {widgets.map(widget => (
                        <WidgetCard
                          key={widget.id}
                          widget={widget}
                          meta={WIDGET_TYPES[widget.type]}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <button
                  onClick={handleAddNew}
                  className="w-full mt-6 py-4 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] rounded-2xl font-bold text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
                >
                  <Plus size={18} />
                  Add Another Widget
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Widget Settings Drawer */}
      <WidgetSettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveWidget}
        widget={editingWidget}
        widgetTypes={WIDGET_TYPES}
        isNew={isNewWidget}
      />

      {/* Bottom status pill */}
      {!saving && updatedBy && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--color-surface-container-highest)]/90 backdrop-blur-sm border border-[var(--color-outline-variant)] rounded-full shadow-lg pointer-events-none">
          <p className="text-[10px] font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider">
            Latest configuration active • Saved by {updatedBy}
          </p>
        </div>
      )}
    </div>
  );
}
