import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>
        
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta sección del sistema.
          Si crees que esto es un error, contacta al administrador.
        </p>
        
        <div className="space-y-3">
          <Link href="/admin/Panel-Administrativo/dashboard">
            <Button className="w-full bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
              Volver al Dashboard
            </Button>
          </Link>
          
          <Link href="/admin/login">
            <Button variant="outline" className="w-full">
              Cerrar Sesión
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}