import { prisma } from '@/lib/prisma';
import { Prisma, AccionAuditoria } from '@prisma/client';

export interface RegistrarAuditoriaInput {
  usuario_id?: bigint | null;
  accion: string;
  tabla: string;
  registro_id: bigint;
  datos_antes?: any; 
  datos_despues?: any;
  ip_address?: string;
  user_agent?: string;
}

export interface FiltrosAuditoria {
  accion?: string;
  tabla?: string;
  usuario_id?: bigint;
}

export interface ResumenAuditoria {
  total: number;
  porAccion: Record<string, number>;
  porTabla: Record<string, number>;
}
/**
 * Convierte de manera profunda y segura cualquier propiedad inválida para JSON (como bigint)
 * en un tipo primitivo serializable y almacenable por PostgreSQL/Prisma.
 * * CORRECCIÓN: Cambiamos el tipo de retorno a 'any' o añadimos Prisma.NullTypes para que acepte Prisma.DbNull
 */
const sanitizarParaJson = (obj: any): any => {
  if (obj === null || obj === undefined) return Prisma.DbNull;
  
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export const auditoriaService = {

  registrar: async (datos: RegistrarAuditoriaInput) => {
    try {
      // Pasamos los datos por la función purificadora. 
      // Si vienen vacíos, la función ya se encarga de retornar Prisma.DbNull de forma segura.
      const datosAntesSanitizados = datos.datos_antes ? sanitizarParaJson(datos.datos_antes) : Prisma.DbNull;
      const datosDespuesSanitizados = datos.datos_despues ? sanitizarParaJson(datos.datos_despues) : Prisma.DbNull;

      return await prisma.auditoria.create({
        data: {
          usuario_id: datos.usuario_id || null,
          accion: datos.accion as AccionAuditoria,
          tabla: datos.tabla,
          registro_id: datos.registro_id,
          datos_antes: datosAntesSanitizados,
          datos_despues: datosDespuesSanitizados,
          ip_address: datos.ip_address || null,
          user_agent: datos.user_agent || null,
        },
      });
    } catch (error) {
      console.error('Error registrando auditoria:', error);
      return null;
    }
  },

  obtenerRegistros: async (filtros?: FiltrosAuditoria, pagina: number = 1, limite: number = 50) => {
    const where: Prisma.auditoriaWhereInput = {};
    if (filtros?.accion) where.accion = filtros.accion as AccionAuditoria;
    if (filtros?.tabla) where.tabla = filtros.tabla;
    if (filtros?.usuario_id) where.usuario_id = filtros.usuario_id;

    const [registros, total] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.auditoria.count({ where }),
    ]);

    return {
      registros,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  },

  obtenerPorTabla: async (tabla: string, registro_id: bigint) => {
    return await prisma.auditoria.findMany({
      where: { tabla, registro_id },
      orderBy: { created_at: 'desc' },
    });
  },

  obtenerPorUsuario: async (usuario_id: bigint, desde?: Date, hasta?: Date) => {
    const where: Prisma.auditoriaWhereInput = { usuario_id };
    if (desde || hasta) {
      where.created_at = {};
      if (desde) where.created_at.gte = desde;
      if (hasta) where.created_at.lte = hasta;
    }

    return await prisma.auditoria.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  },

  limpiarRegistrosAntiguos: async (diasAnterior: number = 90): Promise<number> => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAnterior);

    const result = await prisma.auditoria.deleteMany({
      where: { created_at: { lt: fecha } },
    });
    return result.count;
  },

  generarResumen: async (desde: Date, hasta: Date): Promise<ResumenAuditoria> => {
    const registros = await prisma.auditoria.findMany({
      where: {
        created_at: { gte: desde, lte: hasta },
      },
    });

    return {
      total: registros.length,
      porAccion: registros.reduce<Record<string, number>>((acc, r) => {
        acc[r.accion] = (acc[r.accion] || 0) + 1;
        return acc;
      }, {}),
      porTabla: registros.reduce<Record<string, number>>((acc, r) => {
        acc[r.tabla] = (acc[r.tabla] || 0) + 1;
        return acc;
      }, {}),
    };
  },
};