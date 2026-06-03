'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import AlmacenesTable, { Almacen } from '@/components/admin/almacenes/AlmacenesTable';
import AlmacenFormModal from '@/components/admin/almacenes/AlmacenFormModal';
import { AlmacenDeleteModal } from '@/components/admin/almacenes/AlmacenModals';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AlmacenesToolbar from '@/components/admin/almacenes/AlmacenesToolbar';
import { AlmacenesStats } from '@/components/admin/almacenes/AlmacenesStats';

export default function AlmacenesPage() {
  const { can } = usePermissions();
  const [almacenes, setAlmacenes]         = useState<Almacen[]>([]);
  const [loading, setLoading]             = useState(true);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [editingAlmacen, setEditingAlmacen] = useState<Almacen | null>(null);
  const [deleteAlmacen, setDeleteAlmacen] = useState<Almacen | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('todos');

  const loadAlmacenes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/almacenes');
      if (!res.ok) throw new Error('Error al cargar almacenes');
      setAlmacenes(await res.json());
    } catch (error) {
      toast.error('Error al conectar con la base de datos de almacenes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (can('view', 'almacenes')) loadAlmacenes();
    else setLoading(false);
  }, [can]);

  const stats = useMemo(() => {
    const total    = almacenes.length;
    const activos  = almacenes.filter(a => a.estado === 'activo').length;
    return {
      total,
      activos,
      inactivos:      total - activos,
      capacidadTotal: almacenes.reduce((acc, a) => acc + Number(a.capacidad_total || 0), 0),
    };
  }, [almacenes]);

  const filteredAlmacenes = useMemo(() => almacenes.filter(a => {
    const matchesSearch = a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.direccion?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'todos' || a.estado === statusFilter;
    return matchesSearch && matchesStatus;
  }), [almacenes, searchTerm, statusFilter]);

  const handleSave = async (data: any) => {
    try {
      const method = editingAlmacen ? 'PUT' : 'POST';
      const url    = editingAlmacen
        ? `/api/admin/almacenes/${editingAlmacen.id}`
        : '/api/admin/almacenes';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success(editingAlmacen ? 'Almacén actualizado' : 'Almacén creado');
      setDialogOpen(false);
      loadAlmacenes();
    } catch (error) {
      toast.error('Error al guardar almacén');
      console.error(error);
    }
  };

  if (!can('view', 'almacenes')) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <XCircle className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Acceso Denegado</h1>
      <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminPageHeader
          title="Almacenes"
          description="Gestión integral de centros de distribución y depósitos"
          actionLabel="Nuevo Almacén"
          onAction={can('create', 'almacenes') ? () => { setEditingAlmacen(null); setDialogOpen(true); } : undefined}
        />

        <AlmacenesStats
          stats={stats}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        <AlmacenesToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isLoading={loading}
          onRefresh={loadAlmacenes}
        />

        <AlmacenesTable
          data={filteredAlmacenes}
          isLoading={loading}
          onEdit={can('edit', 'almacenes') ? (a) => { setEditingAlmacen(a); setDialogOpen(true); } : undefined}
          onDelete={can('archive', 'almacenes') ? (a) => setDeleteAlmacen(a) : undefined}
        />
      </div>

      {dialogOpen && (
        <AlmacenFormModal
          almacen={editingAlmacen}
          onClose={() => setDialogOpen(false)}
          onSuccess={loadAlmacenes}
        />
      )}
      {deleteAlmacen && (
        <AlmacenDeleteModal
          almacen={deleteAlmacen}
          onClose={() => setDeleteAlmacen(null)}
          onSuccess={loadAlmacenes}
        />
      )}
    </div>
  );
}