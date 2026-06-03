"use client";

import { Briefcase, ShieldCheck, ShieldOff } from "lucide-react";
import type { PersonalRow } from "@/lib/services/personal-interno.service";

interface Props {
  personal: PersonalRow[];
  loading?: boolean;
  statusFilter?: "activo" | "inactivo" | "suspendido" | null;
  onFilterChange?: (f: "activo" | "inactivo" | "suspendido" | null) => void;
}

export default function StatsPersonal({ personal, statusFilter = null, onFilterChange }: Props) {
  const total = personal.length;
  const activos = personal.filter((p) => p.estado === "activo").length;
  const suspendidos = personal.filter((p) => p.estado === "suspendido").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="TOTAL PERSONAL"
        value={total}
        icon={<Briefcase className="w-6 h-6" />}
        isActive={statusFilter === null}
        color="teal"
        onClick={() => onFilterChange?.(null)}
      />
      <StatCard
        title="ACTIVOS"
        value={activos}
        icon={<ShieldCheck className="w-6 h-6" />}
        isActive={statusFilter === "activo"}
        color="emerald"
        onClick={() => onFilterChange?.("activo")}
      />
      <StatCard
        title="SUSPENDIDOS"
        value={suspendidos}
        icon={<ShieldOff className="w-6 h-6" />}
        isActive={statusFilter === "suspendido"}
        color="orange"
        onClick={() => onFilterChange?.("suspendido")}
      />
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────
export function StatCard({ title, value, icon, isActive, color, onClick }: {
  title: string; value: number; icon: React.ReactNode;
  isActive: boolean; color: string; onClick: () => void;
}) {
  const styles: Record<string, { active: string; iconActive: string; textActive: string }> = {
    pink: { active: "border-pink-500    ring-pink-50    bg-white", iconActive: "bg-pink-600    text-white", textActive: "text-pink-600" },
    emerald: { active: "border-emerald-500 ring-emerald-50 bg-white", iconActive: "bg-emerald-600 text-white", textActive: "text-emerald-600" },
    orange: { active: "border-orange-500  ring-orange-50  bg-white", iconActive: "bg-orange-600  text-white", textActive: "text-orange-600" },
    blue: { active: "border-blue-500    ring-blue-50    bg-white", iconActive: "bg-blue-600    text-white", textActive: "text-blue-600" },
    teal: { active: "border-teal-500    ring-teal-50    bg-white", iconActive: "bg-teal-600    text-white", textActive: "text-teal-600" },
  };
  const s = styles[color] ?? styles.pink;

  return (
    <button
      onClick={onClick}
      className={`group p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${isActive
        ? `ring-4 shadow-xl scale-[1.02] z-10 ${s.active}`
        : "bg-white border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-95"
        }`}
    >
      <div className={`p-3 rounded-lg transition-all duration-300 ${isActive ? `${s.iconActive} rotate-3` : "bg-gray-100 text-gray-600 group-hover:rotate-3"
        }`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black tracking-tight ${isActive ? s.textActive : "text-gray-800"}`}>{value}</p>
      </div>
    </button>
  );
}