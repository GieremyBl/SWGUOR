import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. Consulta de pedidos usando los nombres de columna reales de tu tabla
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('fecha_pedido, total, estado');

    if (error) throw error;

    // --- PROCESAMIENTO PARA GRÁFICA DE VENTAS MENSUALES ---
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Inicializamos los últimos 6 meses con valor 0 para que la gráfica no se vea vacía
    const ventasMensuales = meses.map(mes => ({ name: mes, ventas: 0 }));

    pedidos?.forEach((pedido) => {
      const fecha = new Date(pedido.fecha_pedido);
      const mesIndex = fecha.getMonth();
      // Solo sumamos al total si el pedido no está cancelado (opcional, según tu lógica)
      if (pedido.estado !== 'CANCELADO') {
        ventasMensuales[mesIndex].ventas += Number(pedido.total) || 0;
      }
    });

    // --- PROCESAMIENTO PARA GRÁFICA CIRCULAR (ESTADOS) ---
    // Usamos los estados exactos de tu base de datos: 'PENDIENTE', 'COMPLETADO', 'CANCELADO'
    const estadosData = [
      { name: 'Pendientes', value: pedidos?.filter(p => p.estado === 'PENDIENTE').length || 0, color: '#f97316' },
      { name: 'Completados', value: pedidos?.filter(p => p.estado === 'COMPLETADO').length || 0, color: '#10b981' },
      { name: 'Cancelados', value: pedidos?.filter(p => p.estado === 'CANCELADO').length || 0, color: '#ef4444' },
    ];

    // --- RESUMEN GENERAL ---
    const summary = {
      totalVentas: pedidos?.reduce((acc, p) => acc + (Number(p.total) || 0), 0) || 0,
      totalPedidos: pedidos?.length || 0,
      pendientes: pedidos?.filter(p => p.estado === 'PENDIENTE').length || 0
    };

    return NextResponse.json({
      summary,
      ventasMensuales,
      estadosData
    });

  } catch (error) {
    console.error('Error en Stats:', error);
    return NextResponse.json({ error: 'Error al procesar los datos' }, { status: 500 });
  }
}
