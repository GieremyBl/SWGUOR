import { NextRequest, NextResponse } from "next/server";
import { FichasTecnicasService } from '@/lib/services/fichas-tecnicas.service';
import { obtenerFichaTecnicaConCosto } from '@/lib/services';
import { requireServerRole } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { RolUsuario } from '@/lib/constants/roles';
import type { EstadoFicha } from '@prisma/client';

const FICHAS_ROLES: RolUsuario[] = ['administrador', 'gerente', 'disenador', 'cortador', 'almacenero'];

const ESTADOS_VALIDOS = new Set<EstadoFicha>(['borrador', 'en_revision', 'aprobada', 'obsoleta']);

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

// ============================================================================
// GET - Obtener Ficha Única (por id o id_producto) O Listar con Filtros
// ============================================================================
export async function GET(request: NextRequest) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get("id");
    const id_producto = searchParams.get('id_producto') || searchParams.get('producto_id');
    const estadoRaw = searchParams.get('estado');
    const categoriaId = searchParams.get('categoria_id') || searchParams.get('categoria');
    const busqueda = searchParams.get('busqueda');

    if (estadoRaw && !ESTADOS_VALIDOS.has(estadoRaw as EstadoFicha)) {
      return NextResponse.json({ error: `estado inválido: ${estadoRaw}` }, { status: 400 });
    }
    const estado = estadoRaw as EstadoFicha | undefined;

    // CASO A: Buscar ficha específica por su ID numérico primary key (?id=12)
    if (id) {
      if (isNaN(Number(id))) {
        return NextResponse.json({ error: "ID de ficha inválido, debe ser un valor numérico" }, { status: 400 });
      }
      
      const ficha = await obtenerFichaTecnicaConCosto(Number(id));
      if (!ficha) {
        return NextResponse.json({ error: "Ficha técnica no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: ficha });
    }

    // CASO B: Buscar ficha asignada a un producto específico (?id_producto=45)
    if (id_producto) {
      if (isNaN(Number(id_producto))) {
        return NextResponse.json({ error: "El ID de producto debe ser un valor numérico válido" }, { status: 400 });
      }
      
      // Ajuste de tipo: Pasamos string para cumplir con obtenerPorProducto(producto_id: string)
      const data = await FichasTecnicasService.obtenerPorProducto(String(id_producto));
      if (!data) {
        return NextResponse.json({ error: "No se encontró una ficha técnica vinculada a este producto" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data });
    }

    // CASO C: Listado global con filtros de búsqueda y estado tal cual venía originalmente
    const [data, categorias] = await Promise.all([
      FichasTecnicasService.listar({
        estado: estado || undefined,
        busqueda: busqueda || undefined,
        categoria_id: categoriaId && categoriaId !== 'all' ? categoriaId : undefined,
      }),
      prisma.categorias_productos.findMany({
        where: { activo: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      data,
      categorias: serializeBigInt(categorias),
    });

  } catch (error: any) {
    console.error('[GET /api/admin/fichas-tecnicas]', error);
    return NextResponse.json(
      { error: error.message || "Error interno al procesar las fichas técnicas" }, 
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Crear una nueva Ficha Técnica en la Base de Datos
// ============================================================================
export async function POST(request: NextRequest) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();

    const productoIdFinal = body.id_producto || body.producto_id || body.productoId;
    
    if (!productoIdFinal || isNaN(Number(productoIdFinal))) {
      return NextResponse.json({ error: 'La columna id_producto numérica es obligatoria' }, { status: 400 });
    }

    // Ajuste de tipo: Estructuramos usando la propiedad "producto_id" requerida por la firma de FichasTecnicasService.crear
    const payloadFicha = {
      producto_id: String(productoIdFinal),
      version: body.version || "1.0.0",
      descripcion_detallada: body.descripcion_detallada || body.descripcionDetallada || null,
      sam_total: Number(body.sam_total || body.samTotal || 0),
      costo_estimado: Number(body.costo_estimado || body.costoEstimado || 0),
      ficha_url: body.ficha_url || body.fichaUrl || null,
      imagen_geometral: body.imagen_geometral || body.imagenGeometral || null,
    };

    const fichaNueva = await FichasTecnicasService.crear(payloadFicha);
    
    return NextResponse.json(
      { 
        success: true, 
        data: fichaNueva, 
        message: "Ficha técnica inicializada y registrada exitosamente en el sistema" 
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[POST /api/admin/fichas-tecnicas]', error);
    
    if (error.code === 'P2002' || error.message?.includes('Ya existe')) {
      return NextResponse.json({ error: 'Ya existe una ficha técnica activa registrada para este producto' }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || "Error al registrar la ficha técnica" }, { status: 500 });
  }
}

// ============================================================================
// PUT - Actualizar Ficha Técnica (Soporta query params e inyecciones de body)
// ============================================================================
export async function PUT(request: NextRequest) {
  const auth = await requireServerRole(FICHAS_ROLES);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const body = await request.json();
    
    const idFinal = idParam || body.id;

    if (!idFinal) {
      return NextResponse.json({ error: 'ID de la ficha técnica requerido para actualizar' }, { status: 400 });
    }

    // Mapeamos los datos entrantes sin realizar limpiezas ni exclusiones
    const dataToUpdate = {
      version: body.version,
      descripcion_detallada: body.descripcion_detallada || body.descripcionDetallada,
      sam_total: body.sam_total,
      costo_estimado: body.costo_estimado,
      imagen_geometral: body.imagen_geometral || body.imagenGeometral,
      estado: body.estado,
      ficha_url: body.ficha_url || body.fichaUrl,
    };

    // Ajuste de tipo: Pasamos el id transformado explícitamente a String para cumplir con actualizar(id: string, ...)
    const fichaActualizada = await FichasTecnicasService.actualizar(String(idFinal), dataToUpdate);

    return NextResponse.json({
      success: true,
      data: fichaActualizada,
      message: "Ficha técnica actualizada con éxito",
    });

  } catch (error: any) {
    console.error('[PUT /api/admin/fichas-tecnicas]', error);
    
    if (error.code === 'P2025' || error.message?.includes('not found')) {
      return NextResponse.json({ error: 'Ficha técnica no localizada en la base de datos' }, { status: 404 });
    }
    
    return NextResponse.json({ error: error.message || "Error al modificar la ficha técnica" }, { status: 500 });
  }
}