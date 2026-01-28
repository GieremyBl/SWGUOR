"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogIn, AlertCircle, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ESTADOS_USUARIO, ERROR_MESSAGES } from "@/lib/auth/constants";
import { ADMIN_ROUTES } from "@/lib/constants/admin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Optimización: Pre-carga la ruta del dashboard para que el acceso sea instantáneo
  useEffect(() => {
    router.prefetch(ADMIN_ROUTES.DASHBOARD);
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();

      // 1. Autenticación rápida
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.status === 400 ? ERROR_MESSAGES.INVALID_CREDENTIALS : "Error de conexión");
        setIsLoading(false);
        return;
      }

      // 2. Validación de usuario y estado optimizada
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('auth_id', authData.user?.id)
        .maybeSingle();

      if (usuarioError || !usuario) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.USER_NOT_FOUND);
        setIsLoading(false);
        return;
      }

      // 3. Validación de estado (Inmune a tildes o espacios)
      const estadoNormalizado = usuario.estado?.toString().toUpperCase().trim();
      if (estadoNormalizado !== ESTADOS_USUARIO.ACTIVO) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.INACTIVE_USER);
        setIsLoading(false);
        return;
      }

      // 4. Salto directo al Panel
      router.replace(ADMIN_ROUTES.DASHBOARD);

    } catch (err: any) {
      setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Fondo original */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/costura.webp"
          alt="Background"
          fill
          priority
          className="object-cover opacity-15 pointer-events-none"
        />
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header con tu diseño original */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex items-center gap-3">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-red-500 to-pink-600 shadow-lg">
                {isLoading ? <Loader2 className="text-white w-6 h-6 animate-spin" /> : <LogIn className="text-white w-6 h-6" />}
             </div>
             <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  Modas y Estilos <span className="text-pink-600">GUOR</span>
                </h1>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-tighter">S.A.C. - Gestión Textil</p>
             </div>
          </div>
        </div>

        {/* Card de Login con bordes suaves originales */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Bienvenido</h2>
              <p className="text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email Corporativo</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@guor.com"
                  disabled={isLoading}
                  required
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all disabled:bg-gray-50"
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    className="w-full h-12 px-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Botón con tu gradiente original */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Validando...
                  </span>
                ) : "Ingresar al Sistema"}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mt-4 flex items-center gap-3 animate-in fade-in duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Soporte */}
            <div className="mt-8 pt-6 border-t border-gray-50 text-center">
              <div className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors cursor-help">
                <Mail size={16} />
                <span className="text-xs font-medium">¿Problemas de acceso? soporte@guor.com</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 uppercase tracking-widest font-medium">
          © 2026 Modas y Estilos GUOR
        </p>
      </div>
    </div>
  );
}