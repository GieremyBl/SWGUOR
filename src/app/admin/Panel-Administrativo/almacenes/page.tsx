'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';

import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { AlmacenesStats } from '@/components/admin/almacenes/AlmacenesStats';
import AlmacenesToolbar from '@/components/admin/almacenes/AlmacenesToolbar';
import AlmacenesTable, { type Almacen } from '@/components/admin/almacenes/AlmacenesTable';
import AlmacenFormModal from '@/components/admin/almacenes/AlmacenFormModal';
import { AlmacenDeleteModal } from '@/components/admin/almacenes/AlmacenModals';

export default function AlmacenesPage() {
  const { can } = usePermissions();

  // ── Datos ──────────────────────────────────────────────────
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filtros ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // ── Modales ────────────────────────────────────────────────
  const [formTarget, setFormTarget] = useState<Almacen | null | undefined>(undefined);
  // undefined  → modal cerrado
  // null       → modal abierto en modo "Nuevo"
  // Almacen    → modal abierto en modo "Editar"

  const [deleteTarget, setDeleteTarget] = useState<Almacen | null>(null);

  // ── Fetch ──────────────────────────────────────────────────
  const loadAlmacenes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/almacenes');
      if (!res.ok) throw new Error();
      setAlmacenes(await res.json());
    } catch {
      toast.error('Error al conectar con la base de datos de almacenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (can('view', 'almacenes')) loadAlmacenes();
    else setLoading(false);
  }, [can]);

  // ── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = almacenes.length;
    const activos = almacenes.filter(a => a.estado === 'activo').length;
    return {
      total,
      activos,
      inactivos: total - activos,
      capacidadTotal: almacenes.reduce((acc, a) => acc + Number(a.capacidad_total ?? 0), 0),
    };
  }, [almacenes]);

  // ── Filtrado ───────────────────────────────────────────────
  const filteredAlmacenes = useMemo(() =>
    almacenes.filter(a => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        a.nombre.toLowerCase().includes(q) ||
        (a.direccion?.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === 'todos' || a.estado === statusFilter;
      return matchSearch && matchStatus;
    }),
    [almacenes, searchTerm, statusFilter]
  );

  // ── Acceso denegado ────────────────────────────────────────
  if (!can('view', 'almacenes')) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <XCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <AdminPageHeader
          title="Almacenes"
          description="Gestión integral de centros de distribución y depósitos"
          actionLabel="Nuevo Almacén"
          onAction={() => setFormTarget(null)}
        />

        {/* ── Estadísticas ── */}
        <AlmacenesStats
          stats={stats}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {/* ── Barra de búsqueda y filtros ── */}
        <AlmacenesToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={loading}
          onRefresh={loadAlmacenes}
        />

        {/* ── Tabla ── */}
        <AlmacenesTable
          data={filteredAlmacenes}
          isLoading={loading}
          onEdit={(a) => setFormTarget(a)}
          onDelete={(a) => setDeleteTarget(a)}
        />

      </div>

      {/* ── Modal crear / editar ── */}
      {formTarget !== undefined && (
        <AlmacenFormModal
          almacen={formTarget}
          onClose={() => setFormTarget(undefined)}
          onSuccess={() => {
            setFormTarget(undefined);
            loadAlmacenes();
          }}
        />
      )}

      {/* ── Modal confirmar desactivación ── */}
      {deleteTarget && (
        <AlmacenDeleteModal
          almacen={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            loadAlmacenes();
          }}
        />
      )}
    </div>
  );
}