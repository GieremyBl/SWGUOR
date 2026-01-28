import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  
  const supabase = await createClient();

  // 1. Definir rangos de tiempo (Actual vs Anterior)
  const ahora = new Date();
  const inicioPeriodoActual = new Date();
  inicioPeriodoActual.setDate(ahora.getDate() - days);

  const inicioPeriodoAnterior = new Date();
  inicioPeriodoAnterior.setDate(inicioPeriodoActual.getDate() - days);

  try {
    // 2. Obtener todos los pedidos pagados desde el inicio del periodo anterior
    const { data: todosLosPedidos, error: errorPedidos } = await supabase
      .from("pedidos")
      .select("total, created_at")
      .gte("created_at", inicioPeriodoAnterior.toISOString())
      .eq("estado_pago", "pagado");

    if (errorPedidos) throw errorPedidos;

    // 3. Separar pedidos por periodos
    const pedidosActuales = todosLosPedidos.filter(p => 
      new Date(p.created_at) >= inicioPeriodoActual
    );
    const pedidosAnteriores = todosLosPedidos.filter(p => 
      new Date(p.created_at) >= inicioPeriodoAnterior && 
      new Date(p.created_at) < inicioPeriodoActual
    );

    // 4. Calcular métricas financieras y crecimiento
    const totalActual = pedidosActuales.reduce((acc, p) => acc + (p.total || 0), 0);
    const totalAnterior = pedidosAnteriores.reduce((acc, p) => acc + (p.total || 0), 0);

    let porcentajeCrecimiento = 0;
    if (totalAnterior > 0) {
      porcentajeCrecimiento = ((totalActual - totalAnterior) / totalAnterior) * 100;
    } else {
      porcentajeCrecimiento = totalActual > 0 ? 100 : 0;
    }

    // 5. Agrupar Ventas por Día (Gráfico de Líneas)
    const ventasPorDiaMap = pedidosActuales.reduce((acc: any, curr) => {
      const fecha = new Date(curr.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      acc[fecha] = (acc[fecha] || 0) + curr.total;
      return acc;
    }, {});

    const ventasPorDia = Object.keys(ventasPorDiaMap).map(fecha => ({
      fecha,
      ventas: ventasPorDiaMap[fecha]
    }));

    // 6. Obtener Clientes Nuevos del periodo actual
    const { count: totalClientes, error: errorClientes } = await supabase
      .from("clientes")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", inicioPeriodoActual.toISOString());

    // 7. Ventas por Categoría (Gráfico Circular)
    const { data: catData, error: errorCat } = await supabase
      .from("detalles_pedido")
      .select(`
        cantidad,
        productos (
          categorias (
            nombre
          )
        )
      `)
      .gte("created_at", inicioPeriodoActual.toISOString());

    const catMap = catData?.reduce((acc: any, curr: any) => {
      const catName = curr.productos?.categorias?.nombre || "Otros";
      acc[catName] = (acc[catName] || 0) + (curr.cantidad || 0);
      return acc;
    }, {});

    const ventasPorCategoria = Object.keys(catMap || {}).map(name => ({
      name,
      value: catMap[name]
    }));

    // 8. Respuesta final consolidada
    return NextResponse.json({
      metrics: {
        total: totalActual,
        pedidos: pedidosActuales.length,
        clientes: totalClientes || 0,
        crecimiento: Math.round(porcentajeCrecimiento),
        totalAnterior: totalAnterior
      },
      ventasPorDia,
      ventasPorCategoria
    });

  } catch (error: any) {
    console.error("REPORT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}