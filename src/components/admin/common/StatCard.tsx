import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isActive?: boolean;
  color?: "indigo" | "slate" | "emerald" | "amber" | "pink" | "orange" | "blue";
  onClick?: () => void;
  disabled?: boolean;
}

const colorStyles = {
  indigo: { iconBg: "bg-slate-50 text-indigo-600 border border-slate-100" },
  slate: { iconBg: "bg-slate-50 text-slate-600 border border-slate-100" },
  emerald: { iconBg: "bg-slate-50 text-emerald-600 border border-slate-100" },
  amber: { iconBg: "bg-slate-50 text-amber-600 border border-slate-100" },
  pink: { iconBg: "bg-slate-50 text-indigo-600 border border-slate-100" },
  orange: { iconBg: "bg-slate-50 text-amber-600 border border-slate-100" },
  blue: { iconBg: "bg-slate-50 text-indigo-600 border border-slate-100" },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  isActive,
  color = "slate",
  onClick,
  disabled,
}: StatCardProps) {
  const s = colorStyles[color] || colorStyles.slate;

  return (
    <div
      className={cn(
        // Curvatura idéntica a las tarjetas de tu Dashboard (rounded-[2rem])
        "p-6 rounded-[2rem] border border-slate-100/80 bg-white flex items-center gap-5 w-full shadow-[0_4px_20px_-4px_rgba(148,163,184,0.06)] transition-all duration-300"
      )}
    >
      <div className={cn("p-3.5 rounded-2xl flex-shrink-0", s.iconBg)}>
        <Icon className="w-5 h-5 stroke-[2.2]" />
      </div>
      
      <div className="space-y-0.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          {title}
        </p>
        <p className="text-2xl font-black text-slate-900 tracking-tight font-sans">
          {value}
        </p>
      </div>
    </div>
  );
}