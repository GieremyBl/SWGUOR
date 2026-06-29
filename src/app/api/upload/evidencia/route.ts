import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    STORAGE_BUCKET_EVIDENCIAS_ORDENES,
    STORAGE_BUCKET_EVIDENCIAS_CONFECCION,
    evidenciaOrdenProduccionStoragePath,
    evidenciaConfeccionStoragePath,
} from "@/lib/constants/storage";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const bucketTarget = formData.get("bucketTarget") as string | null;
        const ordenId = formData.get("ordenId") as string | null;
        const etapa = formData.get("etapa") as string | null;
        const confeccionId = formData.get("confeccionId") as string | null;

        // --- Validaciones ---
        if (!file) {
            return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo no permitido. Solo JPG, PNG, WebP y PDF" },
                { status: 400 }
            );
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "El archivo excede el límite de 10 MB" },
                { status: 400 }
            );
        }

        let bucket: string;
        let filePath: string;

        if (bucketTarget === "evidencias-confeccion" && confeccionId) {
            bucket = STORAGE_BUCKET_EVIDENCIAS_CONFECCION;
            filePath = evidenciaConfeccionStoragePath(confeccionId, file.name);
        } else if (ordenId) {
            bucket = STORAGE_BUCKET_EVIDENCIAS_ORDENES;
            filePath = evidenciaOrdenProduccionStoragePath(
                ordenId,
                etapa || "general",
                file.name
            );
        } else {
            return NextResponse.json(
                { error: "Se requiere ordenId o confeccionId para subir evidencia" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("[upload/evidencia] Supabase error:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

        return NextResponse.json({ url: data.publicUrl });
    } catch (err) {
        console.error("[upload/evidencia] Error interno:", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}