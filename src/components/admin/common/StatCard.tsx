import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "indigo" | "slate" | "emerald" | "amber" | "pink" | "orange" | "blue";
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const colorStyles = {
  indigo: {
    active:     "border-indigo-500 ring-indigo-50 bg-indigo-50/50",
    iconActive: "bg-indigo-600 text-white",
    iconIdle:   "bg-slate-50 text-indigo-600 border border-slate-100",
    textActive: "text-indigo-600",
  },
  slate: {
    active:     "border-slate-500 ring-slate-50 bg-slate-50/50",
    iconActive: "bg-slate-700 text-white",
    iconIdle:   "bg-slate-50 text-slate-600 border border-slate-100",
    textActive: "text-slate-700",
  },
  emerald: {
    active:     "border-emerald-500 ring-emerald-50 bg-emerald-50/50",
    iconActive: "bg-emerald-600 text-white",
    iconIdle:   "bg-slate-50 text-emerald-600 border border-slate-100",
    textActive: "text-emerald-600",
  },
  amber: {
    active:     "border-amber-500 ring-amber-50 bg-amber-50/40",
    iconActive: "bg-amber-500 text-white",
    iconIdle:   "bg-slate-50 text-amber-600 border border-slate-100",
    textActive: "text-amber-600",
  },
  pink: {
    active:     "border-pink-500 ring-pink-50 bg-pink-50/50",
    iconActive: "bg-pink-600 text-white",
    iconIdle:   "bg-slate-50 text-pink-600 border border-slate-100",
    textActive: "text-pink-600",
  },
  orange: {
    active:     "border-orange-500 ring-orange-50 bg-orange-50/50",
    iconActive: "bg-orange-600 text-white",
    iconIdle:   "bg-slate-50 text-orange-600 border border-slate-100",
    textActive: "text-orange-600",
  },
  blue: {
    active:     "border-blue-500 ring-blue-50 bg-blue-50/50",
    iconActive: "bg-blue-600 text-white",
    iconIdle:   "bg-slate-50 text-blue-600 border border-slate-100",
    textActive: "text-blue-600",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "slate",
  isActive = false,
  onClick,
  disabled = false,
}: StatCardProps) {
  const s = colorStyles[color] ?? colorStyles.slate;
  const isClickable = !!onClick && !disabled;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable
        ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }
        : undefined
      }
      aria-pressed={isClickable ? isActive : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        // Base
        "group p-5 rounded-2xl border bg-white flex items-center gap-4 w-full",
        "transition-all duration-300 select-none",
        // Sombra base
        "shadow-[0_4px_20px_-4px_rgba(148,163,184,0.08)]",
        // Clickable idle
        isClickable && !isActive && [
          "cursor-pointer border-slate-100",
          "hover:shadow-lg hover:-translate-y-1 active:scale-[0.97]",
        ],
        // Active
        isActive && [
          "cursor-pointer ring-4 shadow-xl scale-[1.02] z-10",
          s.active,
        ],
        // Non-clickable (solo display)
        !isClickable && "cursor-default border-slate-100/80",
        // Disabled
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      )}
    >
      {/* Ícono */}
      <div
        className={cn(
          "p-3 rounded-xl flex-shrink-0 transition-all duration-300",
          isActive
            ? cn(s.iconActive, "rotate-3")
            : cn(s.iconIdle, isClickable && "group-hover:rotate-3"),
        )}
      >
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>

      {/* Texto */}
      <div className="text-left space-y-0.5 overflow-hidden">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">
          {title}
        </p>
        <p className={cn(
          "text-2xl font-black tracking-tight font-sans transition-colors duration-300",
          isActive ? s.textActive : "text-slate-900",
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}