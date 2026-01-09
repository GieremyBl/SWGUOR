"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ESTADOS_USUARIO, ERROR_MESSAGES } from "@/lib/auth/constants";
import { ADMIN_ROUTES } from "@/lib/constants/admin";

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
      const supabase = getSupabaseBrowserClient();

      // 1. Autenticación con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
        setIsLoading(false);
        return;
      }

      // 2. Validar usuario en BD
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, rol, estado, auth_id, nombre_completo, email')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (usuarioError) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.USER_NOT_FOUND);
        setIsLoading(false);
        return;
      }

      if (!usuario) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.USER_NOT_FOUND);
        setIsLoading(false);
        return;
      }

      // 3. Validar estado activo
      const estadoNormalizado = usuario.estado?.toString().toUpperCase().trim();
      
      if (estadoNormalizado !== ESTADOS_USUARIO.ACTIVO) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.INACTIVE_USER);
        setIsLoading(false);
        return;
      }

      // 4. Actualizar último acceso (sin bloquear)
      supabase
        .from('usuarios')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', usuario.id)
        .then((result: any) => {
          if (result.error) {
            console.warn("Error actualizando último acceso:", result.error);
          }
        })
        .catch((err: any) => {
          console.warn("Error inesperado actualizando último acceso:", err);
        });

      // 5. Redirección
      window.location.href = ADMIN_ROUTES.DASHBOARD;

    } catch (err: any) {
      console.error("Error crítico en login:", err);
      setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-50 via-gray-100 to-white flex flex-col items-center justify-center p-4">
      {/* Imagen de fondo optimizada - SIN willChange */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ 
          backgroundImage: "url('/costura.webp')",
          backgroundSize: 'cover',
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

        {/* Card */}
        <div className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 space-y-1">
            <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales corporativas
            </p>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

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

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-linear-to-r from-rose-500 to-pink-600 text-white rounded-md font-medium transition-all duration-300 hover:from-rose-600 hover:to-pink-700 hover:shadow-md hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

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

        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 Modas y Estilos GUOR. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}