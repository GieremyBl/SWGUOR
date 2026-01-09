"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, CheckCircle, AlertCircle } from "lucide-react";

type Usuario = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardCortador({ usuario }: { usuario: Usuario }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenedor principal con padding generoso */}
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Header con más espacio */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard de Corte
        </h1>
        <p className="text-gray-600 mt-1">
          Gestión de tareas de corte y producción
        </p>
      </div>
      {/* KPIs para cortador */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cortes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-gray-600">Piezas por cortar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completados Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-gray-600">Piezas cortadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-600">Prioridad alta</p>
          </CardContent>
        </Card>
      </div>

    {/* Sección de tareas asignadas */}
     <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis Tareas de Corte</CardTitle>
            <CardDescription>Pedidos asignados para corte</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No hay tareas asignadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}