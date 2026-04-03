import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const estadoFilter = searchParams.get('estado');

    let query = supabase
      .from('despachos')
      .select(`
        *,
        personal:usuarios (id, nombre_completo),
        pedido:pedidos (
          id,
          cliente_id,
          direccion_envio,
          cliente:clientes (id, razon_social)
        )
      `)
      .order('created_at', { ascending: false });

    if (estadoFilter && estadoFilter !== 'todos') {
      query = query.eq('estado', estadoFilter);
    }

    const { data: despachos, error } = await query;

    if (error) {
      console.error('Error fetching despachos:', error);
      return NextResponse.json(
        { error: 'Error al obtener despachos' },
        { status: 500 }
      );
    }

    // Formato de respuesta
    const formattedData = (despachos || []).map((desp: any) => ({
      id: desp.id,
      despacho_id: `DSP-${String(desp.id).padStart(6, '0')}`,
      orden: desp.pedido?.id || 'N/A',
      cliente: desp.pedido?.cliente?.razon_social || 'N/A',
      direccion: desp.direccion_entrega || desp.pedido?.direccion_envio || 'N/A',
      estado: desp.estado,
      transportista: getTransportista(desp.id),
      tracking: `TRK-${String(desp.id).padStart(8, '0')}`,
      fechaEntrega: desp.fecha_entrega || null,
      fechaDespacho: desp.fecha_despacho,
      personal: desp.personal?.nombre_completo || 'N/A'
    }));

    return NextResponse.json({
      data: formattedData,
      count: formattedData.length
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('despachos')
      .insert({
        pedido_id: body.pedido_id,
        usuario_id: body.usuario_id,
        direccion_entrega: body.direccion_entrega,
        estado: 'pendiente'
      })
      .select();

    if (error) {
      console.error('Error creating despacho:', error);
      return NextResponse.json(
        { error: 'Error al crear despacho' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data?.[0] }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, estado, fecha_entrega } = body;

    const updateData: any = { estado };
    if (estado === 'entregado' && fecha_entrega) {
      updateData.fecha_entrega = fecha_entrega;
    }

    const { data, error } = await supabase
      .from('despachos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating despacho:', error);
      return NextResponse.json(
        { error: 'Error al actualizar despacho' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data?.[0] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function getTransportista(id: number): string {
  const transportistas = ['Olva Courier', 'Shalom Express', 'InkaExpress'];
  return transportistas[id % transportistas.length];
}
