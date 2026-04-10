"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  ChevronLeft, 
  MessageSquare, 
  FileText, 
  User, 
  Table, 
  GraduationCap,
  Save
} from "lucide-react";
import { CONFIG_FORMS } from "./WidgetForms";

const WIDGET_ICONS = {
  ask_ai:            MessageSquare,
  recommended_posts: FileText,
  author_spotlight:  User,
  salary_table:      Table,
  course_card:       GraduationCap,
};

export default function WidgetSettingsDrawer({ 
  isOpen, 
  onClose, 
  onSave, 
  widget, 
  widgetTypes, 
  isNew 
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [config, setConfig] = useState({});
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (widget) {
      setSelectedType(widget.type);
      setConfig(widget.config || {});
      setLabel(widget.label || widgetTypes[widget.type]?.label || "");
    } else {
      setSelectedType(null);
      setConfig({});
      setLabel("");
    }
  }, [widget, widgetTypes]);

  if (!isOpen) return null;

  const handleSelectType = (type) => {
    setSelectedType(type);
    setLabel(widgetTypes[type].label);
    setConfig({}); // Reset config for the new type or load defaults
  };

  const handleSave = () => {
    onSave({
      ...widget,
      type: selectedType,
      label: label,
      config: config,
      enabled: widget?.enabled ?? true,
    });
  };

  const ConfigForm = selectedType ? CONFIG_FORMS[selectedType] : null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[var(--color-surface)] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)]">
          <div className="flex items-center gap-3">
            {isNew && selectedType && (
              <button 
                onClick={() => setSelectedType(null)}
                className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">
              {isNew ? (selectedType ? 'Configure Widget' : 'Add New Widget') : 'Edit Widget'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedType ? (
            /* Phase 1: Selection Grid */
            <div className="grid grid-cols-1 gap-4">
               <p className="text-sm text-[var(--color-on-surface-variant)] mb-2">
                 Choose a widget type to add to your article sidebar.
               </p>
               {Object.entries(widgetTypes).map(([type, meta]) => {
                 const Icon = WIDGET_ICONS[type] || MessageSquare;
                 return (
                   <button
                     key={type}
                     onClick={() => handleSelectType(type)}
                     className="flex items-start gap-4 p-4 text-left border border-[var(--color-outline-variant)] rounded-2xl hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group"
                   >
                     <div 
                       className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl transition-colors"
                       style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                     >
                       <Icon size={24} />
                     </div>
                     <div>
                       <div className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                         {meta.label}
                       </div>
                       <div className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 leading-relaxed">
                         {meta.description}
                       </div>
                     </div>
                   </button>
                 );
               })}
            </div>
          ) : (
            /* Phase 2: Configuration Form */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 bg-[var(--color-surface-container-low)] rounded-2xl border border-[var(--color-outline-variant)] flex items-center gap-4">
                 <div 
                   className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg"
                   style={{ backgroundColor: `${widgetTypes[selectedType].color}15`, color: widgetTypes[selectedType].color }}
                 >
                   {React.createElement(WIDGET_ICONS[selectedType] || MessageSquare, { size: 20 })}
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Type</div>
                   <div className="text-sm font-bold">{widgetTypes[selectedType].label}</div>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1.5 ml-0.5">
                  Internal Widget Label
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Recommended Articles (Top)"
                />
              </div>

              <div className="pt-2">
                <div className="text-[11px] font-bold text-[var(--color-on-surface-variant)] border-b border-[var(--color-outline-variant)] pb-1 mb-4">
                  WIDGET CONTENT CONFIGURATION
                </div>
                {ConfigForm ? (
                  <ConfigForm config={config} onChange={setConfig} />
                ) : (
                  <p className="text-xs text-center py-8 text-[var(--color-on-surface-variant)]">
                    No settings required for this widget type.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedType && (
          <div className="p-6 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[var(--color-on-surface-variant)] hover:bg-black/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              <Save size={18} />
              Save Widget Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
