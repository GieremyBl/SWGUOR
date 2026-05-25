'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  RefreshCw,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import {
  ESTADO_COTIZACION_PROVEEDOR,
  ESTADOS_COTIZACION_PARA_GENERAR_OC,
  ESTADOS_COTIZACION_PROVEEDOR,
} from '@/lib/constants/cotizacion-proveedor-estados';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import StatCard from '@/components/admin/common/StatCard';
import { useCotizacionesProveedorList } from '@/lib/hooks/useCotizacionesProveedor';
import { formatMontoCotizacion } from '@/components/admin/cotizaciones-proveedor/cotizacion-proveedor-utils';

const PAGE_SIZE = 10;

interface CotizacionRow {
  id: string | number;
  numero_externo?: string | null;
  total_estimado?: number | string;
  moneda?: string | null;
  fecha_solicitud?: string;
  estado?: string;
  proveedores?: { razon_social?: string; ruc?: string };
}

export default function CotizacionesProveedorPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const { items, pagination, isLoading, refetch } = useCotizacionesProveedorList({
    page: currentPage,
    limit: PAGE_SIZE,
    busqueda: searchTerm,
    estadoFilter: estadoFilter === 'todos' ? '' : estadoFilter,
  });

  const rows = (items ?? []) as CotizacionRow[];

  const stats = useMemo(
    () => ({
      total: pagination?.total ?? rows.length,
      borradores: rows.filter((c) => c.estado === ESTADO_COTIZACION_PROVEEDOR.BORRADOR)
        .length,
      montoTotal: rows
        .filter((c) => c.estado !== ESTADO_COTIZACION_PROVEEDOR.ANULADO)
        .reduce((acc, c) => acc + Number(c.total_estimado ?? 0), 0),
    }),
    [rows, pagination?.total],
  );

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Cotizaciones Proveedor"
          description="Registro manual y seguimiento de cotizaciones recibidas"
          actionLabel="Nueva Cotización"
          onAction={() =>
            router.push('/admin/Panel-Administrativo/cotizaciones-proveedor/nueva')
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total" value={stats.total} icon={FileText} color="slate" />
          <StatCard
            title="En borrador"
            value={stats.borradores}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Monto acumulado (PEN aprox.)"
            value={formatMontoCotizacion(stats.montoTotal, 'PEN')}
            icon={DollarSign}
            color="emerald"
            disabled
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por proveedor, RUC o N° cotización..."
              className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select
            value={estadoFilter}
            onValueChange={(v) => {
              setEstadoFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl bg-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {Object.entries(ESTADOS_COTIZACION_PROVEEDOR).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-gray-200"
            onClick={() => refetch()}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 border-b border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Proveedor
                  </th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    N° Cotización
                  </th>
                  <th className="text-right py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Monto
                  </th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Fecha
                  </th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="text-center py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-gray-300" />
                        <span className="text-gray-400 italic text-sm">No hay registros</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((cot) => {
                    const estado = cot.estado ?? 'borrador';
                    const badge = ESTADOS_COTIZACION_PROVEEDOR[estado] ?? {
                      label: estado,
                      bgColor: 'bg-slate-100',
                      color: 'text-slate-600',
                    };
                    const moneda = cot.moneda ?? 'PEN';
                    return (
                      <tr
                        key={String(cot.id)}
                        className="group border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">
                              {cot.proveedores?.razon_social ?? '—'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                              RUC: {cot.proveedores?.ruc ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-600 text-sm font-medium">
                          {cot.numero_externo || `COT-${cot.id}`}
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-slate-800 text-sm">
                          {formatMontoCotizacion(cot.total_estimado, moneda)}
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-xs">
                          {cot.fecha_solicitud
                            ? new Date(cot.fecha_solicitud).toLocaleDateString('es-PE')
                            : '—'}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badge.bgColor} ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {ESTADOS_COTIZACION_PARA_GENERAR_OC.includes(
                              estado as (typeof ESTADOS_COTIZACION_PARA_GENERAR_OC)[number],
                            ) && (
                                <Link
                                  href={`/admin/Panel-Administrativo/ordenes-compra/nueva?cotizacion_id=${cot.id}`}
                                  title="Generar orden de compra"
                                  className="inline-flex p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                </Link>
                              )}
                            <Link
                              href={`/admin/Panel-Administrativo/cotizaciones-proveedor/${cot.id}`}
                              title="Ver cotización"
                              className="inline-flex p-2 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500">
            Página <span className="font-bold text-gray-900">{currentPage}</span> de{' '}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
