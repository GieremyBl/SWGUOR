'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form'; // 1. Importamos useWatch
import { zodResolver } from '@hookform/resolvers/zod';
import { ordenProduccionSchema, OrdenProduccionFormValues } from '@/lib/schemas/ordenes-produccion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// 2. Corregimos las importaciones según las sugerencias de tus hooks reales
import { useCreateOrdenProduccion, useUpdateOrdenProduccion } from '@/lib/hooks/useOrdenProduccion'; 
import { OrdenProduccion } from '@/components/admin/ordenes-produccion/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  X, Loader2, Factory, Save, Plus,
  Package, Wrench, FileText, ShoppingBag,
  ExternalLink,
} from 'lucide-react';

// ─── Option types ─────────────────────────────────────────────────────────────
interface ProductoOption  { id: number; nombre: string; sku: string; }
interface TallerOption    { id: number; nombre: string; especialidad: string; }
interface FichaOption     { id: number; version: string; ficha_url: string | null; producto_nombre: string; }
interface PedidoOption    { id: number; total_unidades: number; estado: string; prioridad: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ESTADO_PEDIDO_LABELS: Record<string, string> = {
  pendiente:          'Pendiente',
  en_produccion:      'En Producción',
  listo_para_despacho:'Listo p/ despacho',
  entregado:          'Entregado',
  cancelado:          'Cancelado',
};

const PRIORIDAD_LABELS: Record<string, string> = {
  baja: 'Baja', normal: 'Normal', alta: 'Alta', urgente: 'Urgente',
};

const ESPECIALIDAD_LABELS: Record<string, string> = {
  corte: 'Corte', costura: 'Costura', confeccion: 'Confección',
  bordado: 'Bordado', estampado: 'Estampado', acabados: 'Acabados', otro: 'Otro',
};

// ─── Mapper ───────────────────────────────────────────────────────────────────
function mapearDatosIniciales(data: OrdenProduccion | null): Partial<OrdenProduccionFormValues> {
  if (!data) return { cantidad_solicitada: 1 };
  return {
    producto_id:         data.producto_id,
    taller_id:           data.taller_id,
    ficha_id:            data.ficha_id,
    pedido_id:           data.pedido_id,
    cantidad_solicitada: data.cantidad_solicitada,
    fecha_entrega:       data.fecha_entrega
      ? new Date(data.fecha_entrega).toISOString().split('T')[0]
      : '',
    notas: data.notas ?? '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface OrdenFormDialogProps {
  open:        boolean;
  onClose:     () => void;
  initialData: OrdenProduccion | null;
}

export default function OrdenFormDialog({ open, onClose, initialData }: OrdenFormDialogProps) {
  // 2. Adaptamos los hooks de mutación corregidos
  const { create, isCreating } = useCreateOrdenProduccion();
  const { update, isUpdating } = useUpdateOrdenProduccion();
  
  const supabase   = getSupabaseBrowserClient();
  const isEditing  = !!initialData;
  const isLoading  = isCreating || isUpdating;

  // ── Options state ──────────────────────────────────────────────────────────
  const [productos,        setProductos]        = useState<ProductoOption[]>([]);
  const [talleres,         setTalleres]          = useState<TallerOption[]>([]);
  const [fichas,           setFichas]            = useState<FichaOption[]>([]);
  const [pedidos,          setPedidos]           = useState<PedidoOption[]>([]);
  const [loadingOptions,   setLoadingOptions]    = useState(false);

  // ── Form ───────────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, control, formState: { errors } } =
    useForm<OrdenProduccionFormValues>({
      resolver:      zodResolver(ordenProduccionSchema),
      defaultValues: mapearDatosIniciales(initialData),
    });

  // 1. Corregimos el uso de watch pasándolo a useWatch para complacer al React Compiler
  const watchProductoId = useWatch({ control, name: 'producto_id' });
  const watchTallerId   = useWatch({ control, name: 'taller_id' });
  const watchFichaId    = useWatch({ control, name: 'ficha_id' });
  const watchPedidoId   = useWatch({ control, name: 'pedido_id' });

  // ── Load options on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);

    Promise.all([
      supabase.from('productos')
        .select('id, nombre, sku')
        .eq('estado', 'activo')
        .order('nombre'),

      supabase.from('talleres')
        .select('id, nombre, especialidad')
        .eq('estado', 'activo')
        .order('nombre'),

      supabase.from('fichas_tecnicas')
        .select('id, version, ficha_url, productos:id_producto(nombre)')
        .order('id'),

      supabase.from('pedidos')
        .select('id, total_unidades, estado, prioridad')
        .not('estado', 'in', '("cancelado","entregado")')
        .order('id', { ascending: false }),
    ])
      .then(([p, t, f, ped]) => {
        if (p.error)   toast.error('Error cargando productos');
        if (t.error)   toast.error('Error cargando talleres');
        if (f.error)   toast.error('Error cargando fichas');
        if (ped.error) toast.error('Error cargando pedidos');

        setProductos((p.data ?? []) as ProductoOption[]);
        setTalleres((t.data ?? []) as TallerOption[]);
        setFichas(
          (f.data ?? []).map((row: any) => ({
            id:              row.id,
            version:         row.version ?? 'sin versión',
            ficha_url:       row.ficha_url ?? null,
            producto_nombre: row.productos?.nombre ?? `Producto #${row.id_producto}`,
          }))
        );
        setPedidos((ped.data ?? []) as PedidoOption[]);
      })
      .finally(() => setLoadingOptions(false));
  }, [open, supabase]); // 3. Añadida la dependencia 'supabase' aquí

  // ── Reset form on data change ──────────────────────────────────────────────
  useEffect(() => {
    reset(mapearDatosIniciales(initialData));
  }, [initialData, reset]);

  const onSubmit = (data: OrdenProduccionFormValues) => {
    if (isEditing && initialData) {
      update(String(initialData.id), data); 
    } else {
      create(data);
    }
    onClose();
  };

  if (!open) return null;

  // ── Resolved previews ──────────────────────────────────────────────────────
  const productoSel = productos.find((p) => p.id === Number(watchProductoId))   ?? null;
  const tallerSel   = talleres.find((t)  => t.id === Number(watchTallerId))     ?? null;
  const fichaSel    = fichas.find((f)    => f.id === Number(watchFichaId))      ?? null;
  const pedidoSel   = pedidos.find((p)   => p.id === Number(watchPedidoId))     ?? null;

  // ── Shared select class ────────────────────────────────────────────────────
  const selectCls = (hasError: boolean) =>
    `w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 bg-white ${
      hasError ? 'border-red-400' : 'border-gray-200'
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Factory className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Orden' : 'Nueva Orden de Producción'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isEditing
                  ? 'Modifica los datos de la orden seleccionada.'
                  : 'Registra una nueva orden para un taller asignado.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

          {/* ── Sección: Producto ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Producto
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Producto *
              </label>
              <select
                {...register('producto_id', { valueAsNumber: true })}
                disabled={loadingOptions}
                className={selectCls(!!errors.producto_id)}
              >
                <option value="">
                  {loadingOptions ? 'Cargando productos...' : 'Seleccionar producto...'}
                </option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — SKU: {p.sku}
                  </option>
                ))}
              </select>
              {errors.producto_id && (
                <p className="text-xs text-red-500 mt-1">{errors.producto_id.message}</p>
              )}
            </div>

            {productoSel && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-800">{productoSel.nombre}</p>
                  <p className="text-[11px] text-rose-500 font-mono">{productoSel.sku}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sección: Taller ────────────────────────────────────────────── */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Taller Asignado
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Taller *
              </label>
              <select
                {...register('taller_id', { valueAsNumber: true })}
                disabled={loadingOptions}
                className={selectCls(!!errors.taller_id)}
              >
                <option value="">
                  {loadingOptions ? 'Cargando talleres...' : 'Seleccionar taller...'}
                </option>
                {talleres.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} — {ESPECIALIDAD_LABELS[t.especialidad] ?? t.especialidad}
                  </option>
                ))}
              </select>
              {errors.taller_id && (
                <p className="text-xs text-red-500 mt-1">{errors.taller_id.message}</p>
              )}
            </div>

            {tallerSel && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-800">{tallerSel.nombre}</p>
                  <p className="text-[11px] text-rose-500 capitalize">
                    {ESPECIALIDAD_LABELS[tallerSel.especialidad] ?? tallerSel.especialidad}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sección: Ficha Técnica ─────────────────────────────────────── */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Ficha Técnica
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Ficha Técnica *
              </label>
              <select
                {...register('ficha_id', { valueAsNumber: true })}
                disabled={loadingOptions}
                className={selectCls(!!errors.ficha_id)}
              >
                <option value="">
                  {loadingOptions ? 'Cargando fichas...' : 'Seleccionar ficha...'}
                </option>
                {fichas.map((f) => (
                  <option key={f.id} value={f.id}>
                    v.{f.version} — {f.producto_nombre}
                    {f.ficha_url ? ' · PDF disponible' : ''}
                  </option>
                ))}
              </select>
              {errors.ficha_id && (
                <p className="text-xs text-red-500 mt-1">{errors.ficha_id.message}</p>
              )}
            </div>

            {fichaSel && (
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-800">{fichaSel.producto_nombre}</p>
                    <p className="text-[11px] text-rose-500 font-mono">versión {fichaSel.version}</p>
                  </div>
                </div>
                {fichaSel.ficha_url && (
                  <a
                    href={fichaSel.ficha_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver PDF
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Sección: Pedido ────────────────────────────────────────────── */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Pedido Asociado
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Pedido *
              </label>
              <select
                {...register('pedido_id', { valueAsNumber: true })}
                disabled={loadingOptions}
                className={selectCls(!!errors.pedido_id)}
              >
                <option value="">
                  {loadingOptions ? 'Cargando pedidos...' : 'Seleccionar pedido...'}
                </option>
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} · {p.total_unidades.toLocaleString()} uds
                    · {ESTADO_PEDIDO_LABELS[p.estado] ?? p.estado}
                    · {PRIORIDAD_LABELS[p.prioridad] ?? p.prioridad}
                  </option>
                ))}
              </select>
              {errors.pedido_id && (
                <p className="text-xs text-red-500 mt-1">{errors.pedido_id.message}</p>
              )}
            </div>

            {pedidoSel && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="w-7 h-7 rounded-full bg-rose-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rose-800">Pedido #{pedidoSel.id}</p>
                  <p className="text-[11px] text-rose-500">
                    {pedidoSel.total_unidades.toLocaleString()} unidades
                    · {ESTADO_PEDIDO_LABELS[pedidoSel.estado] ?? pedidoSel.estado}
                    · Prioridad {PRIORIDAD_LABELS[pedidoSel.prioridad] ?? pedidoSel.prioridad}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sección: Detalles de Producción ───────────────────────────── */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Detalles de Producción
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Cantidad Solicitada *
                </label>
                <Input
                  type="number"
                  {...register('cantidad_solicitada', { valueAsNumber: true })}
                  placeholder="Ej: 400"
                  className={errors.cantidad_solicitada ? 'border-red-400 focus:ring-red-400' : ''}
                />
                {errors.cantidad_solicitada && (
                  <p className="text-xs text-red-500 mt-1">{errors.cantidad_solicitada.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Fecha de Entrega
                  <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                </label>
                <Input type="date" {...register('fecha_entrega')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Notas Adicionales
                <span className="text-gray-400 font-normal ml-1">(opcional)</span>
              </label>
              <Input
                {...register('notas')}
                placeholder="Ej: Usar hilo palo rosa, acabado mate..."
              />
            </div>
          </div>

          {/* ── Aviso en edición ──────────────────────────────────────────── */}
          {isEditing && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                El cambio de etapa o estado de producción se gestiona desde el detalle de la orden.
              </p>
            </div>
          )}

          {/* ── Acciones ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white"
              disabled={isLoading || loadingOptions}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
              ) : (
                <div className="flex items-center gap-2">
                  {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Orden'}</span>
                </div>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}