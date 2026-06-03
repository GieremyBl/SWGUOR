import { notFound } from 'next/navigation';
import { RepresentanteOrdenWorkspace } from '@/components/representante/RepresentanteOrdenWorkspace';
import type { OrdenRepresentanteData } from '@/components/representante/RepresentanteOrdenWorkspace';
import { obtenerOrdenRepresentante } from '@/lib/helpers/representante-orden.helper';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepresentanteOrdenPage({ params }: PageProps) {
  const { id } = await params;
  const data = await obtenerOrdenRepresentante(BigInt(id));

  if (!data) notFound();

  const { orden, talleresActivos } = data;
  const conf = orden.confecciones[0];

  const cliente =
    orden.pedidos?.clientes?.razon_social ||
    orden.pedidos?.clientes?.nombre_comercial ||
    'Cliente';

  const ordenData: OrdenRepresentanteData = {
    id: String(orden.id),
    estado: orden.estado,
    cantidad_solicitada: orden.cantidad_solicitada,
    notas: orden.notas,
    producto: {
      id: String(orden.productos.id),
      nombre: orden.productos.nombre,
      sku: orden.productos.sku,
    },
    taller: {
      id: String(orden.talleres.id),
      nombre: orden.talleres.nombre,
      especialidad: orden.talleres.especialidad,
    },
    ficha: orden.fichas_tecnicas
      ? {
          id: String(orden.fichas_tecnicas.id),
          version: orden.fichas_tecnicas.version,
          ficha_url: orden.fichas_tecnicas.ficha_url,
          imagen_geometral: orden.fichas_tecnicas.imagen_geometral,
          estado: orden.fichas_tecnicas.estado,
        }
      : null,
    pedido: orden.pedidos
      ? { id: String(orden.pedidos.id), cliente }
      : null,
    confeccion: conf
      ? {
          id: String(conf.id),
          estado: conf.estado,
          prenda: conf.prenda,
          cantidad: conf.cantidad,
          notas: conf.notas,
          seguimiento: conf.seguimiento_confeccion.map((s) => ({
            id: String(s.id),
            estado_anterior: s.estado_anterior ?? null,
            estado_nuevo: s.estado_nuevo ?? 'pendiente',
            notas: s.notas,
            created_at: s.created_at?.toISOString() ?? '',
          })),
        }
      : null,
  };

  return (
    <RepresentanteOrdenWorkspace
      orden={ordenData}
      talleresActivos={talleresActivos.map((t) => ({
        id: String(t.id),
        nombre: t.nombre,
        especialidad: t.especialidad,
        contacto: t.contacto,
        telefono: t.telefono,
      }))}
    />
  );
}
