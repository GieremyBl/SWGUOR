
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, Package } from "lucide-react";

type Usuario = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardRepresentante({ usuario }: { usuario: Usuario }) {
  return (
  <div className="min-h-screen bg-gray-50">
      {/* Contenedor principal con padding generoso */}
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Header con más espacio */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard de Representante
        </h1>
        <p className="text-gray-600 mt-1">
          Gestión del taller y confecciones
        </p>
      </div>
      {/* KPIs para representante */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Confección</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-gray-600">Prendas en proceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-gray-600">Esta semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Personal</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">Confeccionistas activos</p>
          </CardContent>
        </Card>
      </div>
      {/* Sección de estado del taller */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Taller</CardTitle>
          <CardDescription>Pedidos en confección</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay pedidos en confección</p>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}