'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ArrowUp,
  ArrowDown,
  RotateCcw,
  AlertCircle,
  PackageOpen,
  Boxes,
  Factory,
  History,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Undo2,
  Wrench,
  ShoppingCart,
  User2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Movimiento {
  id: string;
  producto_id?: string | null;
  insumo_id?: string | null;
  material_id?: string | null;
  cantidad: number;
  motivo?: string | null;
  usuario_id?: string | null;
  tipo_movimiento: string;
  referencia_tipo?: string | null;
  costo_unitario?: number | null;
  stock_anterior?: number | null;
  stock_posterior?: number | null;
  created_at: string;
  updated_at?: string;
  producto?: { id: string; nombre: string };
  productos?: { id: string; nombre: string; sku?: string };
  insumo?: { id: string; nombre: string; unidad_medida: string };
  material?: { id: string; nombre: string };
  materiales?: { id: string; nombre: string };
  usuario?: { id: string; nombre: string };
  usuarios?: {
    id: string;
    email: string;
    personal_interno?: { nombre_completo: string }[];
  };
  almacenes?: { id: string; nombre: string };
}

interface MovimientosTableProps {
  movimientos: Movimiento[];
  isLoading?: boolean;
  pageSize?: number;
}

// ─── Configuración visual de los 12 tipos de movimiento ───────────────────────
const TIPO_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  entrada:                        { label: 'Entrada',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowUp },
  salida:                         { label: 'Salida',            color: 'bg-orange-50 text-orange-700 border-orange-200',   icon: ArrowDown },
  ajuste:                         { label: 'Ajuste',            color: 'bg-blue-50 text-blue-700 border-blue-200',         icon: RotateCcw },
  consumo_orden_produccion:       { label: 'Consumo O/P',       color: 'bg-violet-50 text-violet-700 border-violet-200',   icon: FlaskConical },
  consumo_orden_produccion_item:  { label: 'Consumo O/P ítem',  color: 'bg-purple-50 text-purple-700 border-purple-200',   icon: FlaskConical },
  produccion_entrada:             { label: 'Prod. Entrada',     color: 'bg-teal-50 text-teal-700 border-teal-200',         icon: ArrowUp },
  devolucion_consumo:             { label: 'Dev. Consumo',      color: 'bg-cyan-50 text-cyan-700 border-cyan-200',         icon: Undo2 },
  devolucion_a_proveedor:         { label: 'Dev. Proveedor',    color: 'bg-amber-50 text-amber-700 border-amber-200',      icon: Undo2 },
  recepcion_devolucion_proveedor: { label: 'Recep. Prov.',      color: 'bg-lime-50 text-lime-700 border-lime-200',         icon: ShoppingCart },
  devolucion_a_cliente:           { label: 'Dev. Cliente',      color: 'bg-rose-50 text-rose-700 border-rose-200',         icon: Undo2 },
  recepcion_devolucion_cliente:   { label: 'Recep. Cliente',    color: 'bg-pink-50 text-pink-700 border-pink-200',         icon: ArrowDown },
  incidencia_taller:              { label: 'Incidencia',        color: 'bg-red-50 text-red-700 border-red-200',            icon: Wrench },
};

const DEFAULT_TIPO = { label: 'Otro', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle };

const PAGE_SIZE = 15;

export function MovimientosTable({ movimientos, isLoading, pageSize = PAGE_SIZE }: MovimientosTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(movimientos.length / pageSize);
  const paginated = movimientos.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page when data changes
  React.useEffect(() => { setPage(0); }, [movimientos]);

  const getTipoItem = (mov: Movimiento) => {
    if (mov.producto_id || mov.productos || mov.producto) return { tipo: 'Producto', icon: PackageOpen };
    if (mov.insumo_id  || mov.insumo)                     return { tipo: 'Insumo',   icon: Boxes };
    if (mov.material_id || mov.materiales || mov.material) return { tipo: 'Material', icon: Factory };
    return { tipo: 'Sistema', icon: AlertCircle };
  };

  const getItemName = (mov: Movimiento) => {
    if (mov.productos) return mov.productos.nombre;
    if (mov.producto)  return mov.producto.nombre;
    if (mov.insumo)    return mov.insumo.nombre;
    if (mov.materiales) return mov.materiales.nombre;
    if (mov.material)   return mov.material.nombre;
    return 'Desconocido';
  };

  const getUsuario = (mov: Movimiento) => {
    const personal = mov.usuarios?.personal_interno?.[0]?.nombre_completo;
    if (personal) return personal;
    if (mov.usuarios?.email) return mov.usuarios.email.split('@')[0];
    if (mov.usuario?.nombre) return mov.usuario.nombre;
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RotateCcw className="w-10 h-10 text-pink-400 animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest animate-pulse text-xs">
          Cargando movimientos…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/70">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Fecha / Hora</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Artículo</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cant.</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Previo</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Post.</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref.</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</TableHead>
            <TableHead className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <History className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No hay movimientos registrados</p>
                  <p className="text-slate-300 text-xs">Ajusta los filtros o registra un nuevo movimiento</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((mov) => {
              const tipoItem = getTipoItem(mov);
              const config = TIPO_CONFIG[mov.tipo_movimiento] ?? DEFAULT_TIPO;
              const Icon = config.icon;
              const ItemIcon = tipoItem.icon;
              const usuario = getUsuario(mov);

              return (
                <TableRow key={mov.id} className="group hover:bg-slate-50/60 transition-colors border-slate-50">
                  {/* Fecha */}
                  <TableCell className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                    {format(new Date(mov.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                  </TableCell>

                  {/* Tipo de movimiento */}
                  <TableCell className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${config.color}`}>
                      <Icon className="w-3 h-3 shrink-0" />
                      {config.label}
                    </span>
                  </TableCell>

                  {/* Artículo */}
                  <TableCell className="py-3.5 px-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help max-w-[160px]">
                            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {getItemName(mov)}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3 shadow-xl max-w-[200px]">
                          <p className="text-xs font-bold">{getItemName(mov)}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{tipoItem.tipo}</p>
                          {mov.productos?.sku && (
                            <p className="text-[10px] text-slate-300 mt-1">SKU: {mov.productos.sku}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Cantidad */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <span className={`font-black text-sm ${
                      mov.tipo_movimiento === 'salida' || mov.tipo_movimiento.startsWith('devolucion_a') || mov.tipo_movimiento === 'incidencia_taller'
                        ? 'text-orange-600'
                        : mov.tipo_movimiento === 'entrada' || mov.tipo_movimiento === 'produccion_entrada'
                        ? 'text-emerald-600'
                        : 'text-slate-700'
                    }`}>
                      {mov.cantidad}
                    </span>
                  </TableCell>

                  {/* Stock anterior */}
                  <TableCell className="py-3.5 px-4 text-center text-xs text-slate-400 font-medium">
                    {mov.stock_anterior != null ? mov.stock_anterior.toFixed(1) : '—'}
                  </TableCell>

                  {/* Stock posterior */}
                  <TableCell className="py-3.5 px-4 text-center text-xs font-bold text-slate-700">
                    {mov.stock_posterior != null ? mov.stock_posterior.toFixed(1) : '—'}
                  </TableCell>

                  {/* Referencia */}
                  <TableCell className="py-3.5 px-4">
                    {mov.referencia_tipo && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter border bg-indigo-50 text-indigo-600 border-indigo-100 whitespace-nowrap">
                        {mov.referencia_tipo.replace(/_/g, ' ')}
                      </span>
                    )}
                  </TableCell>

                  {/* Motivo */}
                  <TableCell className="py-3.5 px-4 max-w-[140px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-slate-500 truncate cursor-default">
                            {mov.motivo || '—'}
                          </p>
                        </TooltipTrigger>
                        {mov.motivo && (
                          <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3 shadow-xl max-w-[250px]">
                            <p className="text-xs">{mov.motivo}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Usuario */}
                  <TableCell className="py-3.5 px-4">
                    {usuario ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <User2 className="w-3 h-3 text-pink-500" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">{usuario}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            Mostrando{' '}
            <span className="font-bold text-slate-700">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, movimientos.length)}</span>
            {' '}de{' '}
            <span className="font-bold text-slate-700">{movimientos.length}</span>{' '}registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="h-8 w-8 p-0 rounded-xl border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700">
              {page + 1} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page + 1 >= totalPages}
              className="h-8 w-8 p-0 rounded-xl border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
