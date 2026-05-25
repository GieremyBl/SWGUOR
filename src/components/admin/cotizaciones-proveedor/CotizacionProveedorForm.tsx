'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FormField, FormControl, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  crearCotizacionProveedorSchema,
  type CrearCotizacionProveedorInput,
} from '@/lib/schemas/cotizaciones-proveedor';
import { useCotizacionProveedorMutations } from '@/lib/hooks/useCotizacionesProveedor';
import { CotizacionProveedorPdfUpload } from './CotizacionProveedorPdfUpload';
import { CotizacionPdfExtractor } from './CotizacionPdfExtractor';
import { ProveedorSearchSelect } from './ProveedorSearchSelect';
import { ProveedorQuickCreateModal } from './ProveedorQuickCreateModal';
import { aplicarExtraccionAlFormulario } from './apply-extraccion-to-form';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';
import {
  registrarCotizacionProveedorAction,
  resolverProveedorExtraccionAction,
} from '@/app/admin/Panel-Administrativo/cotizaciones-proveedor/actions';
import { datosProveedorPrefillDesdeExtraccion } from '@/lib/helpers/proveedor-extraccion-helpers';
import type { ProveedorForm } from '@/lib/schemas/proveedor';

export interface ProveedorOption {
  id: string | number;
  razon_social: string;
  ruc?: string;
}

export interface CotizacionProveedorInitial {
  id: string | number;
  proveedor_id: string | number;
  numero_externo?: string | null;
  fecha_solicitud: string;
  fecha_vencimiento?: string | null;
  moneda: string;
  notas?: string | null;
  pdf_url?: string | null;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    unidad?: string;
    tipo_item?: 'insumo' | 'material';
  }>;
}

interface Props {
  proveedores: ProveedorOption[];
  initial?: CotizacionProveedorInitial;
  modo?: 'crear' | 'editar';
}

function toFormValues(initial?: CotizacionProveedorInitial): CrearCotizacionProveedorInput {
  if (!initial) {
    return {
      proveedor_id: 0,
      numero_externo: '',
      fecha_solicitud: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      moneda: 'PEN',
      notas: '',
      items: [{ descripcion: '', cantidad: 1, precio_unitario: 0, unidad: 'unidades', tipo_item: 'insumo' }],
    };
  }
  return {
    proveedor_id: Number(initial.proveedor_id),
    numero_externo: initial.numero_externo ?? '',
    fecha_solicitud: initial.fecha_solicitud?.slice(0, 10) ?? '',
    fecha_vencimiento: initial.fecha_vencimiento?.slice(0, 10) ?? '',
    moneda: (initial.moneda as 'PEN' | 'USD' | 'EUR') ?? 'PEN',
    notas: initial.notas ?? '',
    items: initial.items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: Number(i.cantidad),
      precio_unitario: Number(i.precio_unitario),
      unidad: i.unidad ?? 'unidades',
      tipo_item: i.tipo_item ?? 'insumo',
    })),
  };
}

export function CotizacionProveedorForm({
  proveedores,
  initial,
  modo = 'crear',
}: Props) {
  const router = useRouter();
  const { actualizar, subirPdf, isSaving, isUploadingPdf } = useCotizacionProveedorMutations();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [proveedoresOpts, setProveedoresOpts] = useState(proveedores);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateInitial, setQuickCreateInitial] = useState<Partial<ProveedorForm>>({});
  const [savingCrear, setSavingCrear] = useState(false);

  useEffect(() => {
    setProveedoresOpts(proveedores);
  }, [proveedores]);

  // Tipado estricto del hook asignando la interfaz de entrada mapeada por Zod
  const form = useForm<CrearCotizacionProveedorInput>({
    resolver: zodResolver(crearCotizacionProveedorSchema),
    defaultValues: toFormValues(initial),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const proveedorId = form.watch('proveedor_id');
  const moneda = form.watch('moneda');
  const subtotal = (items || []).reduce(
    (sum, item) => sum + (item?.cantidad || 0) * (item?.precio_unitario || 0),
    0,
  );
  const simbolo = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  const handleExtraccionIa = async (data: CotizacionExtraccionIA, pdfFiles: File[]) => {
    const currentItems = form.getValues('items');
    aplicarExtraccionAlFormulario(data, form.setValue, {
      appendItems: false,
      currentItems,
    });
    if (pdfFiles[0]) setPdfFile(pdfFiles[0]);

    const res = await resolverProveedorExtraccionAction(data);
    if (res.success && res.data) {
      form.setValue('proveedor_id', Number(res.data.id));
      toast.success(`Proveedor vinculado: ${res.data.razon_social}`);
      return;
    }

    setQuickCreateInitial(datosProveedorPrefillDesdeExtraccion(data));
    setQuickCreateOpen(true);
    toast.info('Proveedor no encontrado. Confirme el registro o búsquelo.');
  };

  const onSubmit = async (data: CrearCotizacionProveedorInput) => {
    try {
      if (modo === 'editar' && initial?.id) {
        const res = await actualizar(initial.id, data);
        if (!res.success) throw new Error(res.error || 'Error al actualizar');
        if (pdfFile) await subirPdf(initial.id, pdfFile);
        toast.success('Cotización actualizada');
        router.push(`/admin/Panel-Administrativo/cotizaciones-proveedor/${initial.id}`);
        return;
      }

      setSavingCrear(true);
      const res = await registrarCotizacionProveedorAction(data);
      if (!res.success) throw new Error(res.error || 'Error al registrar');

      const newId = res.data?.id;
      if (!newId) throw new Error('No se obtuvo el ID de la cotización');

      if (pdfFile) await subirPdf(newId, pdfFile);

      toast.success('Cotización registrada en borrador');
      router.push(`/admin/Panel-Administrativo/cotizaciones-proveedor/${newId}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSavingCrear(false);
    }
  };

  const isBusy = isSaving || isUploadingPdf || savingCrear;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CotizacionPdfExtractor disabled={isBusy} onExtracted={handleExtraccionIa} />

        <CotizacionProveedorPdfUpload
          cotizacionId={modo === 'editar' ? initial?.id : null}
          pdfUrl={initial?.pdf_url}
          onFileSelected={setPdfFile}
          onUpload={
            modo === 'editar' && initial?.id
              ? async (file) => {
                  await subirPdf(initial.id, file);
                }
              : undefined
          }
        />

        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Proveedor y cabecera</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="proveedor_id"
              render={() => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Proveedor *</FormLabel>
                  <FormControl>
                    <ProveedorSearchSelect
                      proveedores={proveedoresOpts}
                      value={proveedorId || undefined}
                      disabled={isBusy}
                      onChange={(id) => form.setValue('proveedor_id', id, { shouldValidate: true })}
                      onCreateNew={() => {
                        setQuickCreateInitial({});
                        setQuickCreateOpen(true);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numero_externo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° cotización proveedor</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="COT-2024-001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_solicitud"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha cotización *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_vencimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="moneda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Ítems</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ descripcion: '', cantidad: 1, precio_unitario: 0, unidad: 'unidades', tipo_item: 'insumo' })
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>

          {fields.map((field, idx) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-end border rounded-xl p-3">
              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${idx}.descripcion`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Descripción</FormLabel>
                      <FormControl>
                        <Input {...f} placeholder="Descripción" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${idx}.tipo_item`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Tipo</FormLabel>
                      <Select onValueChange={f.onChange} value={f.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="insumo">Insumo</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${idx}.cantidad`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Cant.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={f.value}
                          onChange={(e) => f.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${idx}.precio_unitario`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel className="text-xs">P. unit.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={f.value}
                          onChange={(e) => f.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2 flex justify-center">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <FormMessage>{form.formState.errors.items?.message}</FormMessage>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center">
          <span className="text-sm uppercase tracking-widest text-slate-300">Total estimado</span>
          <span className="text-3xl font-black">
            {simbolo} {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </section>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem className="bg-white rounded-2xl border p-6">
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={3} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            className="bg-amber-700 hover:bg-amber-800"
          >
            {isBusy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            <Save className="w-4 h-4 mr-1" />
            {modo === 'editar' ? 'Guardar cambios' : 'Registrar cotización (borrador)'}
          </Button>
        </div>

        <ProveedorQuickCreateModal
          open={quickCreateOpen}
          initial={quickCreateInitial}
          onClose={() => setQuickCreateOpen(false)}
          onCreated={(p) => {
            setProveedoresOpts((prev) => {
              if (prev.some((x) => String(x.id) === p.id)) return prev;
              return [...prev, p];
            });
            form.setValue('proveedor_id', Number(p.id), { shouldValidate: true });
          }}
        />
      </form>
    </Form>
  );
}