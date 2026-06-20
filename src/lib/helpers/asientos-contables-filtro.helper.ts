import type { AsientosContablesFiltros } from '@/components/admin/asientos-contables/AsientosContablesToolbar';
import type { AsientoContableFila } from '@/components/admin/asientos-contables/AsientosContablesTable';

export function filtrarAsientosContables(
  asientos: AsientoContableFila[],
  filtros: AsientosContablesFiltros,
): AsientoContableFila[] {
  const busqueda = filtros.busqueda.trim().toLowerCase();

  return asientos.filter((asiento) => {
    const fecha = new Date(asiento.fecha);
    if (filtros.fecha_desde) {
      const desde = new Date(`${filtros.fecha_desde}T00:00:00`);
      if (fecha < desde) return false;
    }
    if (filtros.fecha_hasta) {
      const hasta = new Date(`${filtros.fecha_hasta}T23:59:59`);
      if (fecha > hasta) return false;
    }
    if (filtros.cuenta !== 'todas' && asiento.cuenta !== filtros.cuenta) {
      return false;
    }
    if (!busqueda) return true;

    const texto = [
      asiento.descripcion,
      asiento.pedido_id != null ? String(asiento.pedido_id) : '',
      asiento.pago_id ?? '',
      asiento.cuenta,
    ]
      .join(' ')
      .toLowerCase();

    return texto.includes(busqueda);
  });
}

export function calcularTotalesAsientos(asientos: AsientoContableFila[]) {
  return asientos.reduce(
    (acc, row) => {
      const monto = Number(row.monto) || 0;
      if (row.tipo === 'debe') acc.debe += monto;
      else acc.haber += monto;
      return acc;
    },
    { debe: 0, haber: 0 },
  );
}

export function normalizarAsientoFila(raw: Record<string, unknown>): AsientoContableFila {
  return {
    id: raw.id as number | string,
    fecha: raw.fecha as string | Date,
    tipo: raw.tipo as AsientoContableFila['tipo'],
    monto: raw.monto as number | string,
    cuenta: raw.cuenta as AsientoContableFila['cuenta'],
    descripcion: (raw.descripcion as string | null) ?? null,
    pedido_id: raw.pedido_id != null ? String(raw.pedido_id) : null,
    pago_id: (raw.pago_id as string | null) ?? null,
  };
}
