import { NextResponse } from 'next/server';
 
import {
  getReporteIncidenciasCliente,
} from '@/lib/services/reporte-incidencias-cliente.service';
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
 
    const severidad = searchParams.get('severidad') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
 
    const reporte = await getReporteIncidenciasCliente({
      severidad,
      tipo,
    });
 
    return NextResponse.json(reporte);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error generando reporte de incidencias de cliente' },
      { status: 500 },
    );
  }
}
 