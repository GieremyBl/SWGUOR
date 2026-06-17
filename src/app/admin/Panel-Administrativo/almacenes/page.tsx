'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { toast } from 'sonner';
import { XCircle, ArrowUpDown } from 'lucide-react';
import AlmacenesTable, { Almacen } from '@/components/admin/almacenes/AlmacenesTable';
import { AlmacenDeleteModal } from '@/components/admin/almacenes/AlmacenModals';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AlmacenesToolbar from '@/components/admin/almacenes/AlmacenesToolbar';
import { AlmacenesStats } from '@/components/admin/almacenes/AlmacenesStats';

export default function AlmacenesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [almacenes, setAlmacenes]         = useState<Almacen[]>([]);
  const [loading, setLoading]             = useState(true);
  const [isEditing, setIsEditing]         = useState(false);
  const [editingId, setEditingId]         = useState<string | number | null>(null);
  const [deleteAlmacen, setDeleteAlmacen] = useState<Almacen | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('todos');

  // Panel lateral derecho abierto/cerrado
  const [showMovimientoPanel, setShowMovimientoPanel] = useState(false);
  
  // Estado único del formulario con TODOS los campos de la base de datos
  const [almacenForm, setAlmacenForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    capacidad_total: '',
    unidad_capacidad: 'UNIDADES (Unid.)',
    estado: 'activo',
    descripcion: ''
  });

  const loadAlmacenes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/almacenes');
      if (!res.ok) throw new Error('Error al cargar almacenes');
      const data = await res.json();
      setAlmacenes(data);
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

  // Manejador unificado para Guardar/Actualizar el Almacén desde el panel lateral
  const handleGuardarAlmacen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!almacenForm.nombre.trim()) {
      toast.error('El nombre del almacén es obligatorio');
      return;
    }

    try {
      const url = isEditing ? `/api/admin/almacenes/${editingId}` : '/api/admin/almacenes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...almacenForm,
          capacidad_total: almacenForm.capacidad_total ? Number(almacenForm.capacidad_total) : null
        })
      });

      if (!res.ok) throw new Error('Error en la transacción');

      toast.success(isEditing ? 'Almacén actualizado correctamente' : 'Almacén registrado correctamente');
      setShowMovimientoPanel(false);
      resetForm();
      loadAlmacenes();
    } catch (err) {
      toast.error('Error al sincronizar con la base de datos');
      console.error(err);
    }
  };

  const resetForm = () => {
    setAlmacenForm({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      capacidad_total: '',
      unidad_capacidad: 'UNIDADES (Unid.)',
      estado: 'activo',
      descripcion: ''
    });
    setIsEditing(false);
    setEditingId(null);
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

        {/* Header con el botón principal "Nuevo Almacén" corregido */}
        <AdminPageHeader
          
          title="Almacenes"
          description="Gestión integral de centros de distribución y depósitos"
          actionLabel="Nuevo Almacén"
          onAction={() => { 
            resetForm();
            setShowMovimientoPanel(true); // <--- Corregido: Ahora sí despliega el panel lateral
          }}
        />
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/admin/Panel-Administrativo/reportes/stock')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Ver Reporte de Stock
          </button>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className={showMovimientoPanel ? "lg:col-span-2" : "lg:col-span-3"}>
            <AlmacenesTable
              data={filteredAlmacenes}
              isLoading={loading}
              onEdit={(a) => { 
                setAlmacenForm({
                  nombre: a.nombre || '',
                  direccion: a.direccion || '',
                  telefono: a.telefono || '',
                  email: a.email || '',
                  capacidad_total: a.capacidad_total ? String(a.capacidad_total) : '',
                  unidad_capacidad: a.unidad_capacidad || 'UNIDADES (Unid.)',
                  estado: a.estado || 'activo',
                  descripcion: a.descripcion || ''
                });
                setEditingId(a.id);
                setIsEditing(true);
                setShowMovimientoPanel(true);
              }}
              onDelete={(a) => setDeleteAlmacen(a)}
            />

            {/* Acciones alternativas en la parte inferior */}
            <div className="mt-4 p-4 bg-white rounded-xl border border-dashed border-gray-300 text-center shadow-sm">
              <p className="text-xs text-gray-500 font-medium mb-2">
                📦 Configura los parámetros iniciales del almacén antes de realizar operaciones físicas.
              </p>
              <button 
                type="button"
                onClick={() => {
                  resetForm();
                  setShowMovimientoPanel(true);
                }}
                className="inline-flex items-center space-x-2 text-xs bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-black transition-all cursor-pointer shadow-sm"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Almacén</span>
              </button>
            </div>
          </div>

          {/* Formulario LATERAL de Control / Registro de Almacenes Completo */}
          {showMovimientoPanel && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 space-y-4 animate-in fade-in slide-in-from-right-5 duration-200">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                    {isEditing ? 'Editar Almacén' : 'Control de Stock'}
                  </h3>
                  <p className="text-[11px] text-blue-600 font-semibold">
                    {isEditing ? 'Modificando Registro' : 'Operaciones de Inventario'}
                  </p>
                </div>
                <button type="button" onClick={() => { setShowMovimientoPanel(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleGuardarAlmacen} className="space-y-4 text-xs">
                {/* NOMBRE DEL ALMACÉN */}
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Nombre del Almacén *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: Almacén Central - Sede Principal GUOR"
                    value={almacenForm.nombre}
                    onChange={(e) => setAlmacenForm({...almacenForm, nombre: e.target.value})}
                    className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none focus:bg-white"
                  />
                </div>

                {/* DIRECCIÓN FÍSICA */}
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Dirección Física</label>
                  <input 
                    type="text"
                    placeholder="Ej: Av. Aviación 2415, San Borja"
                    value={almacenForm.direccion}
                    onChange={(e) => setAlmacenForm({...almacenForm, direccion: e.target.value})}
                    className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none focus:bg-white"
                  />
                </div>

                {/* TELÉFONO DE CONTACTO Y CORREO ELECTRÓNICO */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Teléfono de Contacto</label>
                    <input 
                      type="text"
                      placeholder="Ej: 01-4758963"
                      value={almacenForm.telefono}
                      onChange={(e) => setAlmacenForm({...almacenForm, telefono: e.target.value})}
                      className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Correo Electrónico (Email)</label>
                    <input 
                      type="email"
                      placeholder="almacen.central@guor.com"
                      value={almacenForm.email}
                      onChange={(e) => setAlmacenForm({...almacenForm, email: e.target.value})}
                      className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* CAPACIDAD TOTAL Y UNIDAD DE CAPACIDAD */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Capacidad Total Máxima</label>
                    <input 
                      type="number"
                      placeholder="Ej: 1500"
                      value={almacenForm.capacidad_total}
                      onChange={(e) => setAlmacenForm({...almacenForm, capacidad_total: e.target.value})}
                      className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 uppercase mb-1">Unidad de Capacidad</label>
                    <select 
                      value={almacenForm.unidad_capacidad}
                      onChange={(e) => setAlmacenForm({...almacenForm, unidad_capacidad: e.target.value})}
                      className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium outline-none cursor-pointer"
                    >
                      <option value="UNIDADES (Unid.)">UNIDADES (Unid.)</option>
                      <option value="METROS (m)">METROS (m)</option>
                      <option value="KILOGRAMOS (kg)">KILOGRAMOS (kg)</option>
                    </select>
                  </div>
                </div>

                {/* ESTADO OPERATIVO */}
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Estado Operativo</label>
                  <select 
                    value={almacenForm.estado}
                    onChange={(e) => setAlmacenForm({...almacenForm, estado: e.target.value})}
                    className={`w-full p-2 border rounded-md font-bold text-white cursor-pointer outline-none ${
                      almacenForm.estado === 'activo' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    <option value="activo">🟢 ACTIVO (Disponible)</option>
                    <option value="inactivo">🔴 INACTIVO (No Disponible)</option>
                  </select>
                </div>

                {/* DESCRIPCIÓN / NOTAS INTERNAS */}
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Descripción / Notas Internas</label>
                  <textarea 
                    rows={3}
                    placeholder="Ej: Depósito principal de insumos textiles y avíos..."
                    value={almacenForm.descripcion}
                    onChange={(e) => setAlmacenForm({...almacenForm, descripcion: e.target.value})}
                    className="w-full p-2 border rounded-md bg-gray-50 text-gray-800 font-medium focus:bg-white outline-none resize-none font-sans"
                  />
                </div>

                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-md shadow-sm uppercase tracking-wider transition-all cursor-pointer">
                  💾 {isEditing ? 'Actualizar Almacén' : 'Guardar Almacén'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

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