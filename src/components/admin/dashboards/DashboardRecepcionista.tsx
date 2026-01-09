"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Usuario = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardRecepcionista({ usuario }: { usuario: Usuario }) {
  return (
   <div className="min-h-screen bg-gray-50">
      {/* Contenedor principal con padding generoso */}
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Header con más espacio */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard de Recepción
        </h1>
        <p className="text-gray-600 mt-1">
          Gestión de pedidos y atención al cliente
        </p>
      </div>

      {/* KPIs para recepcionista */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-600">Registrados hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Nuevos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-gray-600">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Tareas comunes del día a día</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Link href="/dashboard/pedidos/nuevo">
            <Button className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Button>
          </Link>
          <Link href="/dashboard/clientes/nuevo">
            <Button variant="outline" className="w-full" size="lg">
              <Users className="mr-2 h-4 w-4" />
              Registrar Cliente
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Pedidos pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Pendientes de Confirmación</CardTitle>
          <CardDescription>Pedidos que requieren tu atención</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay pedidos pendientes</p>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}