"use client";

import StatCard from "../common/StatCard";
import { ShoppingBag, Clock, Layers, CheckCircle2, XCircle, Wallet } from "lucide-react";

interface PedidosStatsProps {
  stats: {
    total: number;
    pendientes: number;
    enProceso: number;
    pagados: number;      // ← agregado
    completados: number;
    cancelados: number;
  };
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onPageReset: () => void;
}

export default function PedidosStats({
  stats,
  statusFilter,
  setStatusFilter,
  onPageReset,
}: PedidosStatsProps) {
  const handleFilter = (filter: string) => {
    setStatusFilter(filter);
    onPageReset();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <StatCard
        title="Total Pedidos"
        value={stats.total}
        icon={ShoppingBag}
        color="pink"
        isActive={statusFilter === "todos"}
        onClick={() => handleFilter("todos")}
      />
      <StatCard
        title="Pendientes"
        value={stats.pendientes}
        icon={Clock}
        color="amber"
        isActive={statusFilter === "pendiente"}
        onClick={() => handleFilter("pendiente")}
      />
      <StatCard
        title="En Proceso"
        value={stats.enProceso}
        icon={Layers}
        color="blue"
        isActive={statusFilter === "en_produccion"}
        onClick={() => handleFilter("en_produccion")}
      />
      <StatCard
        title="Pagados"
        value={stats.pagados}
        icon={Wallet}
        color="indigo"
        isActive={statusFilter === "pagado"}
        onClick={() => handleFilter("pagado")}
      />
      <StatCard
        title="Completados"
        value={stats.completados}
        icon={CheckCircle2}
        color="emerald"
        isActive={statusFilter === "entregado"}
        onClick={() => handleFilter("entregado")}
      />
      <StatCard
        title="Cancelados"
        value={stats.cancelados}
        icon={XCircle}
        color="red"
        isActive={statusFilter === "cancelado"}
        onClick={() => handleFilter("cancelado")}
      />
    </div>
  );
}