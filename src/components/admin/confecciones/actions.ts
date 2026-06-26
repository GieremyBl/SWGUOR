"use server";

import { prisma } from '@/lib/prisma';
import type { EtapaConfeccion, EstadoConfeccion } from '@prisma/client';
import { revalidatePath } from 'next/cache';

interface ActualizarEtapaInput {
  confeccionId: string;
  etapaAnterior: EtapaConfeccion;
  etapaNueva: EtapaConfeccion;
  notas: string;
  responsableId: string;
}

/**
 * Función pura que gobierna la sincronización automática:
 * Mapea la etapa física del taller hacia el estado macro del sistema.
 */
function mapearEtapaAEstado(etapa: EtapaConfeccion): EstadoConfeccion {
  if (etapa === "entregado_a_guor") return "completada";
  // Si arranca en la primera etapa o sigue en costura, se asume en producción activa
  return "en_proceso";
}

/**
 * Registra el avance de la fase física del taller, actualizando
 * en simultáneo el estado macro y controlando estados de parada (rechazada/cancelada).
 */
export async function registrarAvanceTaller({
  confeccionId,
  etapaAnterior,
  etapaNueva,
  notas,
  responsableId,
}: ActualizarEtapaInput) {
  try {
    const idConfeccion = BigInt(confeccionId);
    const idResponsable = BigInt(responsableId);

    // Ejecutamos una transacción SQL para leer y escribir con aislamiento total (evita race conditions)
    return await prisma.$transaction(async (tx) => {
      
      // 1. Validar el estado maestro actual de la confección
      const confeccionActual = await tx.confecciones.findUnique({
        where: { id: idConfeccion },
        select: { estado: true, fecha_inicio: true },
      });

      if (!confeccionActual) {
        throw new Error("La orden de confección solicitada no existe.");
      }

      // REGLA DE NEGOCIO: Si el estado es de parada, no se permite alterar las etapas del taller
      if (confeccionActual.estado === "rechazada" || confeccionActual.estado === "cancelada") {
        throw new Error(
          `Operación denegada: El lote se encuentra en estado '${confeccionActual.estado}' y su flujo físico está congelado.`
        );
      }

      // 2. Determinar el nuevo estado maestro correspondiente a la etapa enviada
      const nuevoEstadoCalculado = mapearEtapaAEstado(etapaNueva);

      // 3. Actualizar la tabla maestra 'confecciones' sincronizando ambos campos
      await tx.confecciones.update({
        where: { id: idConfeccion },
        data: {
          estado: nuevoEstadoCalculado, // Sincronizado dinámicamente aquí
          updated_at: new Date(),
          // Control de marcas de tiempo del ciclo de vida industrial
          ...(etapaNueva === "recepcion_cortes" && !confeccionActual.fecha_inicio ? { fecha_inicio: new Date() } : {}),
          ...(etapaNueva === "entregado_a_guor" ? { fecha_fin: new Date() } : {}),
        },
      });

      // 4. Crear el registro de auditoría obligatoria en 'seguimiento_confeccion'
      const nuevoSeguimiento = await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: idConfeccion,
          etapa_anterior: etapaAnterior,
          etapa_nueva: etapaNueva,
          notas: notas.trim() || `Avance de fase registrado: ${etapaAnterior} → ${etapaNueva}.`,
          responsable_id: idResponsable,
        },
      });

      if (!nuevoSeguimiento) {
        throw new Error("No se pudo registrar el seguimiento de la confección.");
      }


      // 5. Si la confección está ligada a una orden de producción maestra, actualizamos su estado
      // Buscamos si existe una relación inversa (ajusta el campo según tu esquema exacto de base de datos)
      const ordenAsociada = await tx.ordenes_produccion.findFirst({
        where: { confecciones: { some: { id: idConfeccion } } },
        select: { id: true }
      });

      if (ordenAsociada) {
        await tx.ordenes_produccion.update({
          where: { id: ordenAsociada.id },
          data: {
            estado: nuevoEstadoCalculado === "completada" ? "completada" : "en_produccion",
            updated_at: new Date(),
          },
        });
      }

      // Revalidar cachés de Next.js para actualizar tableros e interfaces en tiempo real
      revalidatePath("/admin/Panel-Administrative/confecciones");
      revalidatePath("/admin/Panel-Administrative/confecciones/etapas");

      return { success: true, nuevoEstado: nuevoEstadoCalculado };
    });

  } catch (error: any) {
    console.error("Error crítico en sincronización Etapa-Estado:", error);
    return { success: false, error: error.message || "Error interno del servidor en la transacción." };
  }
}

/**
 * Obtiene todas las confecciones activas estructurando su última etapa registrada 
 * en el taller mediante la tabla de seguimientos, mapeando BigInts de forma segura.
 */
export async function obtenerFlujoTalleres() {
  try {
    const confeccionesRaw = await prisma.confecciones.findMany({
      where: {
        // Traemos las que no estén canceladas ni rechazadas para no saturar el flujo operativo
        NOT: {
          estado: { in: ['cancelada', 'rechazada'] }
        }
      },
      select: {
        id: true,
        prenda: true, // Asegúrate de que coincida con tu esquema (ej. prenda o ordenes)
        cantidad: true,
        prioridad: true,
        estado: true,
        // Traemos el último seguimiento para saber con precisión milimétrica su etapa_nuevo actual
        seguimiento_confeccion: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            etapa_nueva: true
          }
        },
        // Si tienes una relación o campo con el nombre del taller externo asignado
        talleres: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    // Mapeamos los registros al formato que espera el Kanban en el cliente
    const confeccionesProcesadas = confeccionesRaw.map((c) => {
      // Determinamos la etapa física basada en el último seguimiento, 
      // si no tiene ninguno asumimos la fase inicial por defecto.
      const etapaFisica = c.seguimiento_confeccion[0]?.etapa_nueva || 'recepcion_cortes';

      return {
        id: c.id.toString(), // Convertimos el BigInt a string seguro para el cliente
        prenda: c.prenda || "Prenda sin especificar",
        cantidad: Number(c.cantidad) || 0,
        prioridad: c.prioridad || "media",
        etapa: etapaFisica as EtapaConfeccion,
        taller: c.talleres?.nombre || "Taller no asignado"
      };
    });

    return { success: true, data: confeccionesProcesadas };
  } catch (error: any) {
    console.error("Error en obtenerFlujoTalleres:", error);
    return { success: false, error: error.message || "Error al leer la base de datos." };
  }
}