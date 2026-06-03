"use client";

import StatCard from "../common/StatCard";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
import type { usuarios } from "@prisma/client";

interface Props {
  usuarios: usuarios[];
  loading?: boolean;
  statusFilter?: "activo" | "inactivo" | null;
  onFilterChange?: (f: "activo" | "inactivo" | null) => void;
}

export default function StatsUsuarios({ usuarios, statusFilter = null, onFilterChange }: Props) {
  const total     = usuarios.length;
  const activos   = usuarios.filter((u) => u.estado === "activo").length;
  const inactivos = usuarios.filter((u) => u.estado !== "activo").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="TOTAL USUARIOS"
        value={total}
        icon={Users}
        isActive={statusFilter === null}
        color="slate"
        onClick={() => onFilterChange?.(null)}
      />
      <StatCard
        title="ACTIVOS"
        value={activos}
        icon={ShieldCheck}
        isActive={statusFilter === "activo"}
        color="emerald"
        onClick={() => onFilterChange?.("activo")}
      />
      <StatCard
        title="SUSPENDIDOS"
        value={inactivos}
        icon={ShieldOff}
        isActive={statusFilter === "inactivo"}
        color="orange"
        onClick={() => onFilterChange?.("inactivo")}
      />
    </div>
  );
}