"use server";

import { prisma } from "@/lib/prisma"; // Ajusta la ruta a tu cliente de Prisma
import { revalidatePath } from "next/cache";

interface ActualizarEtapaInput {
    confeccionId: number;       // BigInt en BD, manejado como número en JS seguro
    etapaAnterior: any;         // Enum EtapaConfeccion
    etapaNueva: any;            // Enum EtapaConfeccion
    notas: string;
    responsableId: number;      // ID del usuario logueado en el ERP
}

export async function registrarAvanceTaller({
    confeccionId,
    etapaAnterior,
    etapaNueva,
    notas,
    responsableId,
}: ActualizarEtapaInput) {
    try {
        // Ejecutamos en una transacción para asegurar consistencia
        await prisma.$transaction([

            // 1. Insertar el historial en seguimiento_confeccion
            prisma.seguimiento_confeccion.create({
                data: {
                    confeccion_id: BigInt(confeccionId),
                    etapa_anterior: etapaAnterior,
                    etapa_nuevo: etapaNueva,
                    notas: notas,
                    responsable_id: BigInt(responsableId),
                },
            }),

            // 2. Actualizar el estado actual en la tabla maestra de confecciones
            prisma.confecciones.update({
                where: { id: BigInt(confeccionId) },
                data: {
                    estado: etapaNueva, // Asegúrate de que el campo en tu tabla maestra se llame así
                },
            }),
        ]);

        // Refrescar los datos en el Front-end de Next.js
        revalidatePath("/admin/confecciones");
        return { success: true };
    } catch (error) {
        console.error("Error crítico en la transacción de base de datos:", error);
        throw new Error("No se pudo procesar el cambio de etapa.");
    }
}