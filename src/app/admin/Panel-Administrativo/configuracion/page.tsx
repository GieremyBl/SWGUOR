"use client";

import { useState, useEffect, useCallback } from 'react';
import { Save, Building2, Store, Users, CreditCard, Percent, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'empresa' | 'tienda' | 'usuarios' | 'pagos' | 'impuestos';

interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  estado: 'activo' | 'inactivo';
}

interface ConfigFormData {
  // Empresa
  nombreEmpresa: string;
  ruc: string;
  contacto: string;
  email: string;
  direccion: string;
  ciudad: string;
  pais: string;
  // Tienda
  nombreTienda: string;
  descripcion: string;
  moneda: string;
  zonaHoraria: string;
  // Impuestos
  igv: number;
  descuentoDefault: number;
}

interface SaveState {
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS = [
  { id: 'empresa' as const, label: 'Empresa', icon: Building2 },
  { id: 'tienda' as const, label: 'Tienda', icon: Store },
  { id: 'usuarios' as const, label: 'Usuarios', icon: Users },
  { id: 'pagos' as const, label: 'Pagos', icon: CreditCard },
  { id: 'impuestos' as const, label: 'Impuestos', icon: Percent },
] as const;

const INITIAL_FORM_DATA: ConfigFormData = {
  nombreEmpresa: '',
  ruc: '',
  contacto: '',
  email: '',
  direccion: '',
  ciudad: '',
  pais: '',
  nombreTienda: '',
  descripcion: '',
  moneda: 'PEN',
  zonaHoraria: 'America/Lima',
  igv: 18,
  descuentoDefault: 0,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ConfiguracionPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('empresa');
  const [formData, setFormData] = useState<ConfigFormData>(INITIAL_FORM_DATA);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle', message: '' });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/configuracion');

      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const { data } = await response.json();
      
      setFormData({
        ...INITIAL_FORM_DATA,
        ...data.empresa,
        ...data.tienda,
        igv: data.impuestos?.igv ?? 18,
        descuentoDefault: data.impuestos?.descuentoDefault ?? 0,
      });
      
      setUsuarios(data.usuarios || []);
    } catch (error) {
      console.error('[ConfigPage] Load error:', error);
      setSaveState({
        status: 'error',
        message: 'Error al cargar la configuración',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Auto-hide success/error messages
  useEffect(() => {
    if (saveState.status === 'success' || saveState.status === 'error') {
      const timer = setTimeout(() => {
        setSaveState({ status: 'idle', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveState.status]);

  const handleFieldChange = useCallback((field: keyof ConfigFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = async () => {
    try {
      setSaveState({ status: 'saving', message: '' });

      const response = await fetch('/api/admin/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      setSaveState({
        status: 'success',
        message: 'Configuración guardada correctamente',
      });
    } catch (error) {
      console.error('[ConfigPage] Save error:', error);
      setSaveState({
        status: 'error',
        message: 'Error al guardar la configuración',
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Configuración
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona los parámetros del sistema
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saveState.status === 'saving'}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveState.status === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>

          {/* Save feedback */}
          {saveState.status !== 'idle' && saveState.status !== 'saving' && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                saveState.status === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveState.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{saveState.message}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          
          {/* Empresa Tab */}
          {activeTab === 'empresa' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Datos de la empresa
                </h2>
                <p className="text-sm text-gray-500">
                  Información corporativa y datos de contacto
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Nombre de la empresa"
                  value={formData.nombreEmpresa}
                  onChange={(val) => handleFieldChange('nombreEmpresa', val)}
                  placeholder="Modas y Estilos GUOR S.A.C."
                />
                <InputField
                  label="RUC"
                  value={formData.ruc}
                  onChange={(val) => handleFieldChange('ruc', val)}
                  placeholder="20123456789"
                />
                <InputField
                  label="Teléfono"
                  value={formData.contacto}
                  onChange={(val) => handleFieldChange('contacto', val)}
                  placeholder="+51 999 999 999"
                />
                <InputField
                  label="Email corporativo"
                  type="email"
                  value={formData.email}
                  onChange={(val) => handleFieldChange('email', val)}
                  placeholder="contacto@guor.com"
                />
                <InputField
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(val) => handleFieldChange('direccion', val)}
                  placeholder="Av. Principal 123"
                  className="md:col-span-2"
                />
                <InputField
                  label="Ciudad"
                  value={formData.ciudad}
                  onChange={(val) => handleFieldChange('ciudad', val)}
                  placeholder="Lima"
                />
                <InputField
                  label="País"
                  value={formData.pais}
                  onChange={(val) => handleFieldChange('pais', val)}
                  placeholder="Perú"
                />
              </div>
            </div>
          )}

          {/* Tienda Tab */}
          {activeTab === 'tienda' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Configuración de tienda
                </h2>
                <p className="text-sm text-gray-500">
                  Parámetros de operación del e-commerce
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Nombre de la tienda"
                  value={formData.nombreTienda}
                  onChange={(val) => handleFieldChange('nombreTienda', val)}
                  placeholder="GUOR Store"
                />
                <InputField
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(val) => handleFieldChange('descripcion', val)}
                  placeholder="Moda femenina de calidad"
                  className="md:col-span-2"
                />
                <SelectField
                  label="Moneda"
                  value={formData.moneda}
                  onChange={(val) => handleFieldChange('moneda', val)}
                  options={[
                    { value: 'PEN', label: 'PEN - Sol Peruano' },
                    { value: 'USD', label: 'USD - Dólar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                  ]}
                />
                <SelectField
                  label="Zona horaria"
                  value={formData.zonaHoraria}
                  onChange={(val) => handleFieldChange('zonaHoraria', val)}
                  options={[
                    { value: 'America/Lima', label: 'America/Lima (GMT-5)' },
                    { value: 'America/New_York', label: 'America/New_York (GMT-4)' },
                    { value: 'Europe/Madrid', label: 'Europe/Madrid (GMT+1)' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    Gestión de usuarios
                  </h2>
                  <p className="text-sm text-gray-500">
                    {usuarios.length} {usuarios.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  <Users className="w-4 h-4" />
                  Agregar usuario
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.length > 0 ? (
                      usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {user.nombre_completo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {user.rol}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                user.estado === 'activo'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                          No hay usuarios registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagos Tab */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Métodos de pago
                </h2>
                <p className="text-sm text-gray-500">
                  Configura los métodos de pago aceptados
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Tarjeta de crédito', 'Transferencia bancaria', 'Efectivo', 'Billetera digital'].map((metodo) => (
                  <label
                    key={metodo}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{metodo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Impuestos Tab */}
          {activeTab === 'impuestos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  Configuración fiscal
                </h2>
                <p className="text-sm text-gray-500">
                  Impuestos y descuentos aplicables
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="IGV (%)"
                  type="number"
                  value={formData.igv}
                  onChange={(val) => handleFieldChange('igv', Number(val))}
                  min={0}
                  max={100}
                />
                <InputField
                  label="Descuento por defecto (%)"
                  type="number"
                  value={formData.descuentoDefault}
                  onChange={(val) => handleFieldChange('descuentoDefault', Number(val))}
                  min={0}
                  max={100}
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Nota importante</p>
                  <p>Estos valores se aplicarán automáticamente en nuevas ventas y cotizaciones.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

interface InputFieldProps {
  label: string;
  type?: 'text' | 'email' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  min,
  max,
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = '',
}: SelectFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}