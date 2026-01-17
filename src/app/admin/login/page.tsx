"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Mail, Eye, EyeOff } from "lucide-react"; // Importar iconos de ojo
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ESTADOS_USUARIO, ERROR_MESSAGES } from "@/lib/auth/constants";
import { ADMIN_ROUTES } from "@/lib/constants/admin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para visibilidad

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

      // 2. Validar usuario en BD
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, rol, estado, auth_id')
        .eq('auth_id', authData.user?.id)
        .maybeSingle();

      if (usuarioError || !usuario) {
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

      // 4. Actualizar acceso y Redirección
      window.location.href = ADMIN_ROUTES.DASHBOARD;

    } catch (err: any) {
      setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Fondo con textura sutil */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{ 
          backgroundImage: "url('/costura.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-r from-red-500 to-pink-600 mb-4 shadow-lg">
            <LogIn className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Modas y Estilos GUOR
          </h1>
          <p className="text-gray-500 mt-1 font-medium">S.A.C. - Gestión Textil</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">Bienvenido</h2>
              <p className="text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email Corporativo</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@guor.com"
                    required
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Ingresar al Sistema"
                )}
              </button>
            </form>

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