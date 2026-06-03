'use client';

import React, { useId, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  createCotizacionSchema,
  type CreateCotizacionInput,
} from '@/lib/schemas/cotizaciones';
import { createCotizacion } from '@/lib/helpers/cotizaciones-helpers';
import { DatosGeneralesSection } from './DatosGeneralesSection';
import { ItemsSection } from './ItemsSection';
import { ResumenFinanciero } from './ResumenFinanciero';

interface CotizacionFormProps {
  clientes:  { id: number; razon_social: string | null; ruc: string }[];
  productos: {
    id: number;
    nombre: string;
    sku: string;
    precio: number;
    variantes?: { id: number; color: string; talla: string; sku: string }[];
  }[];
}

export function CotizacionForm({ clientes, productos }: CotizacionFormProps) {
  const router      = useRouter();
  const formId      = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCotizacionInput>({
    resolver: zodResolver(createCotizacionSchema),
    defaultValues: {
      cliente_id:            '',
      nombre_cliente_manual: '',
      moneda:                'PEN',
      valida_hasta:          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                               .toISOString().split('T')[0],
      tasa_impuesto:         'IGV',
      empresa:               'Modas y Estilos Guor S.a.C.',
      contacto:              '',
      tipo_destino:          '',
      vendedor:              '',
      tipo_venta:            '',
      unidad_negocio:        '',
      forma_pago:            '',
      metodo:                '',
      direccion_entrega:     '',
      direccion_factura:     '',
      condicion_entrega:     '',
      tiempo_entrega:        '',
      tipo_operacion:        'Venta interna',
      idioma:                'Español',
      referencia:            '',
      probabilidad:          '',
      fecha_cierre:          '',
      notas_internas:        '',
      items:                 [],
    },
  });

  // ── Cálculo de totales en tiempo real ──────────────────────────────────────
  const watchedItems        = useWatch({ control: form.control, name: 'items' });
  const watchedTipoOp       = useWatch({ control: form.control, name: 'tipo_operacion' });
  const watchedTasaImpuesto = useWatch({ control: form.control, name: 'tasa_impuesto' });
  const moneda              = useWatch({ control: form.control, name: 'moneda' }) ?? 'PEN';

  const resumenFinanciero = useMemo(() => {
    const subtotalGeneral = (watchedItems ?? []).reduce(
      (sum, item) => sum + (item.cantidad ?? 0) * (item.precio_unitario ?? 0),
      0,
    );

    const esExportacion = watchedTipoOp === 'Exportación';
    const tasa          = esExportacion ? 0 : watchedTasaImpuesto === 'IGV' ? 0.18 : 0;
    const igv           = subtotalGeneral * tasa;
    const total         = subtotalGeneral + igv;

    return { subtotalGeneral, igv, total, tasa, esExportacion };
  }, [watchedItems, watchedTipoOp, watchedTasaImpuesto]);

  const simboloMoneda = moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : 'S/';

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (
    data: CreateCotizacionInput,
    estadoInicial: 'borrador' | 'enviada' = 'borrador',
  ) => {
    try {
      setIsSubmitting(true);

      const {
        empresa, contacto, tipo_destino, vendedor, tipo_venta,
        unidad_negocio, forma_pago, metodo, direccion_entrega,
        direccion_factura, condicion_entrega, tiempo_entrega,
        tasa_impuesto, tipo_operacion, idioma, referencia,
        probabilidad, fecha_cierre, notas_internas,
        cliente_id, nombre_cliente_manual, valida_hasta, moneda, items,
      } = data;

      const erpMetadata = JSON.stringify({
        empresa, contacto, tipo_destino, vendedor, tipo_venta,
        unidad_negocio, forma_pago, metodo, direccion_entrega,
        direccion_factura, condicion_entrega, tiempo_entrega,
        tasa_impuesto, tipo_operacion, idioma, referencia,
        probabilidad, fecha_cierre,
      });

      const notasCompletas = notas_internas
        ? `${notas_internas}\n\n[ERP_META]: ${erpMetadata}`
        : `[ERP_META]: ${erpMetadata}`;

      const result = await createCotizacion({
        cliente_id:            cliente_id || undefined,
        nombre_cliente_manual: nombre_cliente_manual || undefined,
        valida_hasta,
        moneda:                moneda ?? 'PEN',
        tasa_impuesto:         tasa_impuesto ?? 'IGV',
        tipo_operacion:        tipo_operacion || undefined,
        notas_internas:        notasCompletas,
        items,
        estado_inicial:        estadoInicial,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Error al crear la cotización');
        return;
      }

      const msg =
        estadoInicial === 'enviada'
          ? `Cotización ${result.data?.cotizacion_id} enviada a revisión`
          : `Cotización ${result.data?.cotizacion_id} guardada como borrador`;
      toast.success(msg);
      router.push('/admin/Panel-Administrativo/cotizaciones');
    } catch {
      toast.error('Error inesperado al crear la cotización');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        id={`${formId}-cotizacion-form`}
        onSubmit={form.handleSubmit((data) => onSubmit(data, 'borrador'))}
        className="space-y-6"
      >
        {/* ── Datos Generales ── */}
        <DatosGeneralesSection form={form} clientes={clientes} />

        {/* ── Productos / Ítems ── */}
        <ItemsSection
          form={form}
          productos={productos}
          simboloMoneda={simboloMoneda}
        />

        {/* ── Resumen Financiero ── */}
        <ResumenFinanciero
          subtotalGeneral={resumenFinanciero.subtotalGeneral}
          igv={resumenFinanciero.igv}
          total={resumenFinanciero.total}
          tasa={resumenFinanciero.tasa}
          esExportacion={resumenFinanciero.esExportacion}
          simboloMoneda={simboloMoneda}
        />

        {/* ── Botones ── */}
        <div className="flex items-center justify-end gap-4 sticky bottom-6 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-11 px-6 font-bold uppercase rounded-xl gap-2"
            disabled={isSubmitting}
          >
            <ArrowLeft size={15} /> Cancelar
          </Button>
          <Button
            type="submit"
            form={`${formId}-cotizacion-form`}
            disabled={isSubmitting}
            variant="outline"
            className="h-11 px-6 font-bold uppercase rounded-xl gap-2"
          >
            {isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Guardando...</>
            ) : (
              <><Save size={15} /> Guardar borrador</>
            )}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase rounded-xl gap-2"
            onClick={form.handleSubmit((data) => onSubmit(data, 'enviada'))}
          >
            {isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Enviando...</>
            ) : (
              'Enviar a revisión'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}