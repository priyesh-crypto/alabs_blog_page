"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  FileText, 
  User, 
  Table, 
  GraduationCap,
  Layout,
  Eye,
  EyeOff
} from "lucide-react";

const WIDGET_ICONS = {
  ask_ai:            MessageSquare,
  recommended_posts: FileText,
  author_spotlight:  User,
  salary_table:      Table,
  course_card:       GraduationCap,
};

export default function WidgetCard({ 
  widget, 
  onEdit, 
  onDelete, 
  onToggle,
  meta 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.3 : 1,
  };

  const Icon = WIDGET_ICONS[widget.type] || Layout;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-3 p-3 bg-[var(--color-surface-container-low)] border rounded-xl transition-all duration-200 ${
        widget.enabled 
          ? 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary-container)]' 
          : 'border-[var(--color-outline-variant)] opacity-60'
      } ${isDragging ? 'shadow-2xl border-[var(--color-primary)]' : 'shadow-sm'}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
      >
        <GripVertical size={18} />
      </div>

      {/* Icon Wrapper */}
      <div 
        className="w-10 h-10 flex items-center justify-center rounded-lg"
        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
      >
        <Icon size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[var(--color-on-surface)] truncate">
            {widget.label || meta.label}
          </span>
          {!widget.enabled && (
             <span className="text-[10px] font-bold bg-[var(--color-surface-container-highest)] px-1.5 py-0.5 rounded uppercase text-[var(--color-on-surface-variant)]">
               Disabled
             </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-on-surface-variant)] truncate">
          {widget.type === 'salary_table' && widget.config?.title ? widget.config.title : meta.description}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggle(widget.id)}
          className={`p-2 rounded-lg transition-all ${
            widget.enabled 
              ? 'text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/10' 
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
          }`}
          title={widget.enabled ? "Disable" : "Enable"}
        >
          {widget.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        
        <button
          onClick={() => onEdit(widget)}
          className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/10 rounded-lg transition-all"
          title="Edit"
        >
          <Pencil size={18} />
        </button>

        <button
          onClick={() => onDelete(widget.id)}
          className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-container)]/10 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
