'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MOTIVO_DEVOLUCION_PROV_LABELS } from '@/lib/constants/devoluciones-proveedor';
import { fetchAllProveedoresActivos } from '@/lib/helpers/proveedores-helpers';
import type { CrearDevolucionProveedorInput } from '@/lib/schemas/devoluciones-proveedor';
import type { MotivoDevolucionProv } from '@prisma/client';
import { Loader2 } from 'lucide-react';

interface RecursoOption {
  id: string;
  nombre: string;
  stock: number;
  unidad?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CrearDevolucionProveedorInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function DevolucionProveedorCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const [proveedores, setProveedores] = useState<Array<{ id: string; razon_social: string }>>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [tipoRecurso, setTipoRecurso] = useState<'insumo' | 'material'>('insumo');
  const [recursos, setRecursos] = useState<RecursoOption[]>([]);
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  const [recursoId, setRecursoId] = useState('');
  const [motivo, setMotivo] = useState<MotivoDevolucionProv>('insumo_defectuoso');
  const [cantidad, setCantidad] = useState('1');
  const [ordenId, setOrdenId] = useState('');
  const [montoRecuperar, setMontoRecuperar] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const recursoSeleccionado = useMemo(
    () => recursos.find((r) => r.id === recursoId),
    [recursos, recursoId],
  );

  useEffect(() => {
    if (!open) return;
    setLoadingProveedores(true);
    fetchAllProveedoresActivos()
      .then(setProveedores)
      .catch(() => toast.error('No se pudieron cargar proveedores'))
      .finally(() => setLoadingProveedores(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setProveedorId('');
      setTipoRecurso('insumo');
      setRecursos([]);
      setRecursoId('');
      setMotivo('insumo_defectuoso');
      setCantidad('1');
      setOrdenId('');
      setMontoRecuperar('');
      setObservaciones('');
    }
  }, [open]);

  useEffect(() => {
    if (!proveedorId) {
      setRecursos([]);
      setRecursoId('');
      return;
    }

    setLoadingRecursos(true);
    setRecursoId('');

    const endpoint =
      tipoRecurso === 'insumo'
        ? `/api/admin/insumos?proveedor_id=${proveedorId}`
        : `/api/admin/materiales?proveedor_id=${proveedorId}`;

    fetch(endpoint, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        const lista =
          tipoRecurso === 'insumo'
            ? (json.data?.insumos ?? json.data ?? [])
            : (json.data ?? []);

        const mapped: RecursoOption[] = (lista as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id),
          nombre: String(item.nombre ?? 'Sin nombre'),
          stock: Number(item.stock_actual ?? 0),
          unidad: (item.unidad_medida as string | null) ?? null,
        }));

        setRecursos(mapped);
        if (mapped.length === 0) {
          toast.warning(`No hay ${tipoRecurso === 'insumo' ? 'insumos' : 'materiales'} para este proveedor`);
        }
      })
      .catch(() => {
        toast.error('Error al cargar recursos del proveedor');
        setRecursos([]);
      })
      .finally(() => setLoadingRecursos(false));
  }, [proveedorId, tipoRecurso]);

  const handleSubmit = async () => {
    if (!proveedorId || !recursoId) {
      toast.error('Selecciona proveedor y recurso');
      return;
    }

    const qty = Number(cantidad);
    const maxStock = recursoSeleccionado?.stock ?? 0;

    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Cantidad inválida');
      return;
    }

    if (qty > maxStock) {
      toast.error(`Stock insuficiente. Disponible: ${maxStock}`);
      return;
    }

    const base = {
      proveedor_id: Number(proveedorId),
      cantidad: qty,
      motivo,
      ...(ordenId.trim() ? { orden_id: Number(ordenId) } : {}),
      ...(montoRecuperar.trim() ? { monto_estimado_recuperar: Number(montoRecuperar) } : {}),
      ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
    };

    const payload: CrearDevolucionProveedorInput =
      tipoRecurso === 'insumo'
        ? { tipo_recurso: 'insumo', insumo_id: Number(recursoId), ...base }
        : { tipo_recurso: 'material', material_id: Number(recursoId), ...base };

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva devolución a proveedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <Select value={proveedorId} onValueChange={setProveedorId} disabled={loadingProveedores}>
              <SelectTrigger>
                <SelectValue placeholder={loadingProveedores ? 'Cargando...' : 'Seleccionar proveedor'} />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.razon_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de recurso *</Label>
              <Select
                value={tipoRecurso}
                onValueChange={(v) => setTipoRecurso(v as 'insumo' | 'material')}
                disabled={!proveedorId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insumo">Insumo</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orden de compra</Label>
              <Input
                placeholder="ID opcional"
                value={ordenId}
                onChange={(e) => setOrdenId(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{tipoRecurso === 'insumo' ? 'Insumo' : 'Material'} a devolver *</Label>
            <Select
              value={recursoId}
              onValueChange={setRecursoId}
              disabled={!proveedorId || loadingRecursos || recursos.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingRecursos
                      ? 'Cargando...'
                      : recursos.length === 0
                        ? 'Sin recursos'
                        : 'Seleccionar'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {recursos.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.nombre} · stock {r.stock}
                    {r.unidad ? ` ${r.unidad}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoDevolucionProv)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOTIVO_DEVOLUCION_PROV_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={0.0001}
                step="any"
                max={recursoSeleccionado?.stock}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monto estimado a recuperar (S/)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={montoRecuperar}
              onChange={(e) => setMontoRecuperar(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalle del defecto, lote, factura relacionada..."
              rows={3}
            />
          </div>

          {tipoRecurso === 'material' && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
              Las devoluciones de material registran la salida de inventario de inmediato. El
              seguimiento logístico se refleja como completado al registrar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar devolución'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
