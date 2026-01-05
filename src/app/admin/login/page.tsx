"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, updateLastAccess } from "@/lib/supabase";
import dynamic from "next/dynamic";

// Importaciones dinámicas de componentes pesados
const AlertCircle = dynamic(() => import("lucide-react").then(m => ({ default: m.AlertCircle })), {
  ssr: false,
});
const LogIn = dynamic(() => import("lucide-react").then(m => ({ default: m.LogIn })), {
  ssr: false,
});
const Mail = dynamic(() => import("lucide-react").then(m => ({ default: m.Mail })), {
  ssr: false,
});

// Tipo para el usuario
interface Usuario {
  id: number;
  rol: string;
  estado: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Paso 1: Autenticar
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError || !data.user) {
        setError("Credenciales inválidas");
        setIsLoading(false);
        return;
      }

      // Paso 2: Obtener usuario
      const queryResult = await supabase
        .from('usuarios')
        .select('id, rol, estado')
        .eq('auth_id', data.user.id)
        .maybeSingle();

      const usuario = queryResult.data as Usuario | null;
      const usuarioError = queryResult.error;

      if (usuarioError || !usuario) {
        setError("Usuario no encontrado en el sistema");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Paso 3: Verificar estado
      if (usuario.estado?.toUpperCase() !== 'ACTIVO') {
        setError("Tu cuenta no está activa");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Paso 4: Actualizar último acceso usando el helper
      updateLastAccess(usuario.id);

      // Paso 5: Redirigir inmediatamente
      router.push("/admin/Panel-Administrativo/dashboard");
      router.refresh();

    } catch (error) {
      console.error("[LOGIN] Error:", error);
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-50 via-gray-100 to-white flex flex-col items-center justify-center p-4">
      {/* Imagen de fondo con lazy loading */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ 
          backgroundImage: "url('/costura.webp')",
          backgroundSize: 'cover',
          willChange: 'transform'
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Modas y Estilos GUOR
          </h1>
          <p className="text-gray-600 mt-2">
            S.A.C. - Sistema de Gestión Textil
          </p>
        </div>

        {/* Card - Usando estilos directos en vez de componentes */}
        <div className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 space-y-1">
            <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales corporativas
            </p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Corporativo
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@guor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-md font-medium transition-all duration-300 hover:from-rose-600 hover:to-pink-700 hover:shadow-md hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  "Iniciando sesión..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Info adicional */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      ¿No tienes acceso al sistema?
                    </p>
                    <p className="text-sm text-blue-700">
                      Contacta al administrador del sistema para solicitar tus credenciales.
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Email: admin@guor.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 Modas y Estilos GUOR. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}