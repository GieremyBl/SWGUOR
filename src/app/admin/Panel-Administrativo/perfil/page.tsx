"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Lock, Save, AlertCircle, CheckCircle2, Shield, Calendar, Camera, Upload, Eye, EyeOff } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

import { usePermissions } from "@/lib/hooks/usePermissions";
import { cn } from "@/lib/utils";

export default function PerfilPage() {
  const { usuario, isLoading: loadingPermisos } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del perfil
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Cambio de contraseña
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (usuario) {
      loadUserData();
    }
  }, [usuario]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre_completo, email, telefono, avatar_url, created_at, ultimo_acceso')
        .eq('id', usuario?.id)
        .single();

      if (error) throw error;

      if (data) {
        setNombreCompleto(data.nombre_completo || "");
        setEmail(data.email || "");
        setTelefono(data.telefono || "");
        setAvatarUrl(data.avatar_url || "");
      }
    } catch (err: any) {
      console.error("Error cargando datos del usuario:", err);
      setError("Error al cargar los datos del perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar los 2MB");
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      const supabase = getSupabaseBrowserClient();

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${usuario?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar base de datos
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', usuario?.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setSuccess("Foto de perfil actualizada correctamente");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error subiendo imagen:", err);
      setError(err.message || "Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getSupabaseBrowserClient();

      // Validaciones
      if (!nombreCompleto.trim()) {
        setError("El nombre completo es obligatorio");
        setIsSaving(false);
        return;
      }

      // Validar email si es administrador y cambió el email
      const isAdmin = usuario?.rol?.toLowerCase() === 'administrador';
      if (isAdmin && email.trim() && email.trim() !== (usuario as any)?.email) {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError("El formato del email no es válido");
          setIsSaving(false);
          return;
        }

        // Actualizar email en Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
        });

        if (authError) {
          setError("Error al actualizar el email: " + authError.message);
          setIsSaving(false);
          return;
        }
      }

      // Actualizar datos en la tabla usuarios
      const updateData: any = {
        nombre_completo: nombreCompleto.trim(),
        telefono: telefono.trim() || null,
      };

      // Si es admin y cambió el email, también actualizar en la tabla
      if (isAdmin && email.trim() !== (usuario as any)?.email) {
        updateData.email = email.trim().toLowerCase();
      }

      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuario?.id);

      if (updateError) throw updateError;

      setSuccess(isAdmin && email.trim() !== (usuario as any)?.email 
        ? "Perfil actualizado. Revisa tu nuevo email para confirmar el cambio."
        : "Perfil actualizado correctamente"
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      console.error("Error actualizando perfil:", err);
      setError(err.message || "Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getSupabaseBrowserClient();

      // Validaciones
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Todos los campos de contraseña son obligatorios");
        setIsSaving(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres");
        setIsSaving(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setIsSaving(false);
        return;
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        setError("La contraseña actual es incorrecta");
        setIsSaving(false);
        return;
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error cambiando contraseña:", err);
      setError(err.message || "Error al cambiar la contraseña");
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPermisos || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h1>
          <p className="text-gray-600">Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 py-12">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Mi Perfil</h1>
          <p className="text-gray-600 text-lg">Administra tu información personal y configuración de cuenta</p>
        </div>

        {/* Alertas */}
        {success && (
          <Alert className="mb-8 bg-green-50 border-green-200 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-8 bg-red-50 border-red-200 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Usuario */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Información de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center pb-6 border-b">
                {/* Avatar con opción de cambio */}
                <div className="relative group mb-8">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-linear-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                  
                  {/* Botón de cambiar foto */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-full flex items-center justify-center shadow-lg hover:from-red-600 hover:to-pink-700 transition-all hover:scale-110 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <h3 className="font-bold text-xl text-gray-900 text-center mb-2">{nombreCompleto}</h3>
                <p className="text-sm text-gray-500 mb-4">{email}</p>
                <p className="text-xs text-gray-400 px-6 text-center">
                  Click en la cámara para cambiar foto
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Rol</p>
                    <p className="font-medium text-gray-900 capitalize">{usuario.rol}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Estado</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {usuario.estado}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formularios */}
          <div className="lg:col-span-2 space-y-8">
            {/* Datos Personales */}
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-6 h-6" />
                  Datos Personales
                </CardTitle>
                <CardDescription className="text-base">
                  Actualiza tu información personal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nombreCompleto">Nombre Completo *</Label>
                    <Input
                      id="nombreCompleto"
                      type="text"
                      placeholder="Juan Pérez García"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      required
                      disabled={isSaving}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Corporativo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={usuario?.rol?.toLowerCase() !== 'administrador' || isSaving}
                      className={cn(
                        "h-11",
                        usuario?.rol?.toLowerCase() !== 'administrador' && "bg-gray-50 cursor-not-allowed"
                      )}
                    />
                    <p className="text-xs text-gray-500">
                      {usuario?.rol?.toLowerCase() === 'administrador' 
                        ? "Como administrador, puedes cambiar tu email corporativo."
                        : "El email no se puede modificar. Contacta al administrador si necesitas cambiarlo."
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="+51 987 654 321"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      disabled={isSaving}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Cambiar Contraseña */}
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lock className="w-6 h-6" />
                  Seguridad
                </CardTitle>
                <CardDescription className="text-base">
                  Cambia tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showPasswordSection ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordSection(true)}
                    className="w-full h-12 text-base"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Cambiar Contraseña
                  </Button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    
                    {/* Contraseña Actual */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={isSaving}
                        className="h-11, pr-10"
                      />
                      <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    </div>

                    {/* Nueva Contraseña */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isSaving}
                        className="h-11, pr-10"
                      />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      <p className="text-xs text-gray-500">
                        Mínimo 6 caracteres
                      </p>
                    </div>

                    {/* Confirmar Nueva Contraseña */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isSaving}
                        className="h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setError("");
                        }}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-linear-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Actualizar Contraseña
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}