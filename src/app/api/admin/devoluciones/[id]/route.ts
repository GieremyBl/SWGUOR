import { NextRequest, NextResponse } from "next/server";
import { requireServerRole } from "@/lib/auth/server";
import { DevolucionesService } from "@/lib/services/devoluciones.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireServerRole(["administrador", "almacenero"]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { estado, notas_internas, monto_reembolsado } = body;

    const data = await DevolucionesService.actualizarEstado(
      parseInt(id),
      estado,
      notas_internas,
      monto_reembolsado,
      auth.user.id
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}