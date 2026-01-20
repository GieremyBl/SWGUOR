"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Printer, Truck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PedidosTableProps {
  data: any[];
  onView: (pedido: any) => void;
}

export default function PedidosTable({ data, onView }: PedidosTableProps) {
  
  // Función para renderizar el estilo del Badge según el estado
  const getStatusBadge = (status: string) => {
    const styles: any = {
      pendiente: "bg-orange-50 text-orange-700 border-orange-100",
      completado: "bg-emerald-50 text-emerald-700 border-emerald-100",
      cancelado: "bg-red-50 text-red-700 border-red-100",
      en_envio: "bg-blue-50 text-blue-700 border-blue-100",
    };

    const label: any = {
      pendiente: "Pendiente",
      completado: "Entregado",
      cancelado: "Cancelado",
      en_envio: "En Camino",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.pendiente}`}>
        {label[status] || status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold text-gray-700 w-25">Pedido</TableHead>
            <TableHead className="font-bold text-gray-700">Cliente</TableHead>
            <TableHead className="font-bold text-gray-700 text-center">Fecha</TableHead>
            <TableHead className="font-bold text-gray-700 text-center">Estado</TableHead>
            <TableHead className="font-bold text-gray-700 text-right">Total</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-gray-400 font-medium">
                No se encontraron pedidos registrados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((pedido) => (
              <TableRow key={pedido.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-bold text-pink-600">
                  #{pedido.id.toString().padStart(4, '0')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">
                      {pedido.clientes?.nombre} {pedido.clientes?.apellido}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">
                      ID: {pedido.cliente_id}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-gray-600">
                  {new Date(pedido.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(pedido.estado)}
                </TableCell>
                <TableCell className="text-right font-black text-gray-900">
                  S/ {pedido.total?.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-pink-50 hover:text-pink-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs uppercase text-gray-400">Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView(pedido)} className="gap-2 cursor-pointer">
                        <Eye className="w-4 h-4 text-blue-500" /> Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <Printer className="w-4 h-4 text-gray-500" /> Imprimir Ticket
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 cursor-pointer text-orange-600">
                        <Truck className="w-4 h-4" /> Actualizar Estado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}