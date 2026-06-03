import { redirect } from 'next/navigation';

/** Ruta alias → panel administrativo con sidebar y layout. */
export default function InventarioReservasRedirect() {
  redirect('/admin/Panel-Administrativo/inventario/reservas');
}
