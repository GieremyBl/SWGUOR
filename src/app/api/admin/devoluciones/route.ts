import { NextRequest, NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server";
import { DevolucionesService } from "@/lib/services/devoluciones.service";

export async function GET(req: NextRequest) {
  const auth = await requireServerRole(["administrador", "almacenero"]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado") || "todos";
    
    const data = await DevolucionesService.listar({ estado });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}