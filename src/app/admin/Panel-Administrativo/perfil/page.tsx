'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Usuario } from '@/types/supabase.types';
import { Camera, Save, Lock, User, Phone, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadUsuario = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/admin/login';
          return;
        }

        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (error) throw error;

        setUsuario(data);
        setFormData({
          nombre_completo: data.nombre_completo || '',
          email: data.email || '',
          telefono: data.telefono || '',
        });
      } catch (error) {
        console.error('Error cargando usuario:', error);
        setMessage({ type: 'error', text: 'Error al cargar los datos del usuario' });
      } finally {
        setLoading(false);
      }
    };

    loadUsuario();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
        })
        .eq('id', usuario.id);

      if (error) throw error;

      setUsuario(prev => prev ? { ...prev, ...formData } : null);
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-amber-50 via-white to-pink-50">
      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Modificar Perfil</h1>
        </div>
          {/* Mensaje */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="font-medium text-sm sm:text-base">{message.text}</span>
            </div>
          )}

          <div className="space-y-6 sm:space-y-8">
            {/* Sección: Foto de Perfil */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                  <User className="w-5 sm:w-6 h-5 sm:h-6 text-rose-500 shrink-0" />
                  Foto de Perfil
                </h2>

                <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-start gap-6 sm:gap-8 md:gap-12">
                  {/* Avatar Container */}
                  <div className="relative shrink-0">
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-2xl ring-4 ring-rose-100 bg-linear-to-br from-rose-400 to-pink-600">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl sm:text-7xl font-bold text-white opacity-80">
                            {usuario?.nombre_completo?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Botón Cámara */}
                    <button
                      onClick={handleImageClick}
                      className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-linear-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white p-3 sm:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Camera className="w-5 sm:w-6 h-5 sm:h-6" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Info y Descripción */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{usuario?.nombre_completo}</h3>
                    <p className="text-rose-600 capitalize font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{usuario?.rol?.replace('_', ' ')}</p>
                    <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
                      {profileImage 
                        ? '✓ Nueva imagen cargada correctamente' 
                        : 'Haz clic en el icono de cámara para actualizar tu foto de perfil'}
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-amber-800">
                        <span className="font-semibold">💡 Consejo:</span> Una foto de perfil profesional ayuda a mejorar tu presencia en el sistema
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Información Personal */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                  <User className="w-5 sm:w-6 h-5 sm:h-6 text-rose-500 shrink-0" />
                  Información Personal
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Nombre Completo */}
                    <div className="sm:col-span-2">
                      <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        id="nombre_completo"
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Ingresa tu nombre completo"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500 mt-1">No puedes cambiar tu email</p>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                          Teléfono
                        </span>
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Ingresa tu teléfono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-linear-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 sm:w-5 h-4 sm:h-5" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sección: Cambiar Contraseña */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-12">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                  <Lock className="w-5 sm:w-6 h-5 sm:h-6 text-rose-500 shrink-0" />
                  Seguridad
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-6">
                    {/* Contraseña Actual */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Ingresa tu contraseña actual"
                      />
                    </div>

                    {/* Nueva Contraseña */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>

                    {/* Confirmar Contraseña */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        disabled={isSaving}
                        className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Confirma tu nueva contraseña"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-linear-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 sm:w-5 h-4 sm:h-5" />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
