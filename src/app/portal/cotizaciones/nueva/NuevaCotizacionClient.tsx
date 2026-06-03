'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { crearSolicitudCotizacion } from '@/app/portal/cotizaciones/actions';
import { usePortal } from '@/lib/hooks/usePortal';
import { CatalogoCotizacion } from '@/components/portal/cotizaciones/panel/CatalogoCotizacion';
import { ItemResumen } from '@/components/portal/cotizaciones/panel/ItemResumen';
import { ResumenFinanciero } from '@/components/portal/cotizaciones/panel/ResumenFinanciero';
import { BotonesAccion } from '@/components/portal/cotizaciones/panel/BotonesAccion';

export function NuevaCotizacionClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { itemsBorrador, resumenBorrador, cliente, limpiarBorrador } = usePortal();
  const [mensaje, setMensaje] = useState('');

  const idsAgregados = itemsBorrador.map((i) => i.producto_id);
  const puedeEnviar = itemsBorrador.length > 0 && mensaje.trim().length > 0;

  const handleEnviar = (accion: 'borrador' | 'enviar') => {
    if (itemsBorrador.length === 0) {
      toast.error('Tu lista está vacía.');
      return;
    }

    // ── Guardar borrador ──────────────────────────────────────────────────────
    // Los ítems ya viven en el PortalContext; no hay llamada al servidor.
    // Sólo confirmamos con un toast y volvemos al historial.
    if (accion === 'borrador') {
      toast.success('Borrador guardado. Puedes retomarlo cuando quieras.');
      router.push('/portal/cotizaciones');
      return;
    }

    // ── Generar cotización ────────────────────────────────────────────────────
    if (!mensaje.trim()) {
      toast.error('El mensaje es obligatorio.');
      return;
    }

    startTransition(async () => {
      const response = await crearSolicitudCotizacion({
        mensaje: mensaje.trim(),
        items: itemsBorrador.map((item) => ({
          producto_id: item.producto_id,
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          color_snapshot: item.color,
          talla_snapshot: item.talla,
        })),
      });

      if (!response.success) {
        const dic: Record<string, string> = {
          unauthenticated: 'Tu sesión expiró.',
          cliente_no_encontrado: 'No tienes perfil comercial asignado.',
          mensaje_requerido: 'Escribe un mensaje.',
          items_requeridos: 'Incluye productos.',
          item_invalido: 'Cantidades inconsistentes.',
        };
        toast.error(dic[response.error] ?? response.error);
        return;
      }

      toast.success(`Solicitud ${response.numero} registrada.`);
      limpiarBorrador?.();
      setMensaje('');
      router.push('/portal/cotizaciones');
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-4 pb-16">

      {/* ── Encabezado ── */}
      <header
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-5 gap-4"
        style={{ borderColor: 'var(--guor-stone)' }}
      >
        <div className="space-y-1">
          <Link
            href="/portal/cotizaciones"
            className="inline-flex items-center gap-1 text-xs font-bold transition-colors"
            style={{ color: 'var(--guor-gold)' }}
          >
            <ChevronLeft size={14} /> Regresar
          </Link>
          <h1
            className="text-2xl font-black tracking-tight flex items-center gap-2"
            style={{ color: 'var(--guor-dark)' }}
          >
            <FileText size={24} style={{ color: 'var(--guor-gold)' }} />
            Módulo Integrado de Cotizaciones
          </h1>
          <p className="text-xs" style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>
            Configure presupuestos a medida, proponga precios unitarios y adjunte consideraciones logísticas.
          </p>
        </div>
        <Link
          href="/portal/cotizaciones"
          className="text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-colors text-center"
          style={{
            borderColor: 'var(--guor-stone-mid)',
            color: 'var(--guor-dark)',
            backgroundColor: 'white',
          }}
        >
          Historial de Presupuestos
        </Link>
      </header>

      {/* ── Grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* PANEL IZQUIERDO — Catálogo */}
        <section
          className="lg:col-span-5 rounded-2xl overflow-hidden border flex flex-col"
          style={{
            backgroundColor: 'var(--guor-cream)',
            borderColor: 'var(--guor-stone)',
            minHeight: '620px',
          }}
        >
          <CatalogoCotizacion idsAgregados={idsAgregados} />
        </section>

        {/* PANEL DERECHO — Borrador + Resumen financiero */}
        <section className="lg:col-span-7 space-y-4">
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
          >

            {/* Cabecera del panel */}
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{ backgroundColor: 'var(--guor-cream-deep)', borderColor: 'var(--guor-stone)' }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: 'var(--guor-dark)', opacity: 0.5 }}
                >
                  Desglose Financiero Propuesto
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--guor-dark)', opacity: 0.4 }}
                >
                  {itemsBorrador.length === 0
                    ? 'Sin productos en lista.'
                    : `${itemsBorrador.length} SKUs · ${resumenBorrador.total_unidades.toLocaleString()} unidades totales`}
                </p>
              </div>
              {itemsBorrador.length > 0 && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: 'var(--guor-gold-dust)',
                    borderColor: 'var(--guor-gold-pale)',
                    color: 'var(--guor-gold)',
                  }}
                >
                  Borrador Activo
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">

              {/* ── Lista de ítems del borrador ── */}
              {itemsBorrador.length === 0 ? (
                <div
                  className="text-center py-14 text-xs rounded-xl border-2 border-dashed"
                  style={{
                    borderColor: 'var(--guor-stone)',
                    color: 'var(--guor-dark)',
                    opacity: 0.35,
                  }}
                >
                  Seleccione variaciones del catálogo para comenzar la estimación.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {itemsBorrador.map((item) => (
                    <ItemResumen key={item.variante_id} item={item} />
                  ))}
                </div>
              )}

              {/* ── Sección inferior: sólo visible con ítems ── */}
              {itemsBorrador.length > 0 && (
                <>
                  {/* ResumenFinanciero incluye SelectorZonaEnvio y direccion_fiscal */}
                  <div
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: 'white', borderColor: 'var(--guor-stone)' }}
                  >
                    <ResumenFinanciero />
                  </div>

                  {/* Mensaje comercial — requerido sólo para enviar */}
                  <div>
                    <label
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                      style={{ color: 'var(--guor-dark)', opacity: 0.6 }}
                    >
                      <MessageSquare size={13} style={{ color: 'var(--guor-gold)' }} />
                      Especificaciones y Mensaje Comercial{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="Ej.: Cotización para campaña Q3, entrega estimada en 3 semanas..."
                      className="w-full text-xs rounded-xl px-4 py-3 outline-none resize-none border"
                      style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--guor-stone)',
                        color: 'var(--guor-dark)',
                      }}
                    />
                  </div>

                  {/* Botones: Generar cotización / Guardar borrador */}
                  <BotonesAccion
                    onEnviar={handleEnviar}
                    isSending={isPending}
                    puedeEnviar={puedeEnviar}
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}