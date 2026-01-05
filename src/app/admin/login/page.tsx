"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle, Mail } from "lucide-react";

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

    console.log("[LOGIN] Iniciando autenticación para:", email);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[LOGIN] Resultado de autenticación:", {
        success: !!data.user,
        userId: data.user?.id,
        hasSession: !!data.session,
        error: loginError?.message
      });

      if (loginError) {
        console.error("[LOGIN] Error de autenticación:", loginError);
        setError("Credenciales inválidas. Por favor, intenta de nuevo.");
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        console.error("[LOGIN] No se obtuvo usuario del auth");
        setError("Error al iniciar sesión.");
        setIsLoading(false);
        return;
      }

      console.log("[LOGIN] Autenticación exitosa, obteniendo datos del usuario");
      
      // Reintentar obtener datos del usuario con backoff
      let usuario = null;
      let usuarioError = null;
      const maxReintentos = 3;
      
      for (let intento = 0; intento < maxReintentos; intento++) {
        const resultado = await supabase
          .from('usuarios')
          .select('*')
          .eq('auth_id', data.user.id)
          .single() as any;
        
        usuarioError = resultado.error;
        usuario = resultado.data;
        
        if (usuario) {
          console.log("[LOGIN] Usuario encontrado en intento:", intento + 1);
          break;
        }
        
        if (intento < maxReintentos - 1) {
          console.log("[LOGIN] Usuario no encontrado, reintentando en 1 segundo...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log("[LOGIN] Datos del usuario:", {
        encontrado: !!usuario,
        id: usuario?.id,
        estado: usuario?.estado,
        rol: usuario?.rol
      });

      if (usuarioError || !usuario) {
        console.error("[LOGIN] Error obteniendo usuario de BD:", usuarioError);
        setError("No se encontraron datos del usuario. Contacta al administrador.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const estadoNormalizado = usuario.estado?.toString().trim().toUpperCase();

      if (estadoNormalizado !== 'ACTIVO') {
        console.error("[LOGIN] Usuario no autorizado, estado:", usuario.estado);
        await supabase.auth.signOut();
        setError("Tu cuenta no está activa. Contacta a soporte.");
        setIsLoading(false);
        return;
      }

      console.log("[LOGIN] Usuario activo, actualizando último acceso");
      
      await updateUserLastAccess(usuario.id);

      console.log("[LOGIN] Redirigiendo al dashboard");

      router.push("/admin/Panel-Administrativo/dashboard");

    } catch (error) {
      console.error("[LOGIN] Error inesperado:", error);
      setError("Ocurrió un error. Por favor, intenta de nuevo.");
      setIsLoading(false);
    }
  };

  const updateUserLastAccess = async (userId: number) => {
    try {
      const { error } = await (supabase.from('usuarios') as any)
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('[LOGIN] Error actualizando último acceso:', error);
      }
    } catch (error) {
      console.error('[LOGIN] Error actualizando último acceso:', error);
      // No lanzamos error porque no queremos bloquear el login
    }
  };

  return (
    <div className="min-h-screen relative bg-linear-to-br from-gray-50 via-gray-100 to-white flex flex-col items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: "url('/costura.jpg')" }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Modas y Estilos GUOR
          </h1>
          <p className="text-gray-600 mt-2">
            S.A.C. - Sistema de Gestión Textil
          </p>
        </div>

        <Card className="shadow-xl border-0 rounded-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales corporativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@guor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-linear-to-r from-rose-500 to-pink-600 transition-all duration-300 hover:from-rose-600 hover:to-pink-700 hover:shadow-md hover:scale-[1.01]"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Iniciando sesión..."
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
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
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 Modas y Estilos GUOR. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}