"use client";

import { Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VentasTable({ data, onViewDetail }: any) {
  
  const getEstadoBadge = (estado: string) => {
    const styles: any = {
      pendiente: "bg-yellow-100 text-yellow-700 border-yellow-200",
      en_produccion: "bg-blue-100 text-blue-700 border-blue-200",
      entregado: "bg-green-100 text-green-700 border-green-200",
      cancelado: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <Badge className={`${styles[estado] || "bg-gray-100"} capitalize shadow-none border`}>
        {estado.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead className="font-bold">Código</TableHead>
          <TableHead className="font-bold">Fecha</TableHead>
          <TableHead className="font-bold">Cliente</TableHead>
          <TableHead className="font-bold">Vendedor</TableHead>
          <TableHead className="font-bold text-center">Estado</TableHead>
          <TableHead className="font-bold text-right">Total</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-gray-500 italic">
              No se encontraron registros de ventas.
            </TableCell>
          </TableRow>
        ) : (
          data.map((v: any) => (
            <TableRow key={v.id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell className="font-mono font-bold text-pink-600">
                {v.codigo_pedido || `#${v.id.toString().padStart(5, '0')}`}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(v.created_at), "dd/MM/yyyy", { locale: es })}
                </div>
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {v.cliente?.nombre || "Venta Directa"}
              </TableCell>
              <TableCell className="text-sm text-gray-500 uppercase">
                {v.vendedor?.nombre || "S/A"}
              </TableCell>
              <TableCell className="text-center">
                {getEstadoBadge(v.estado_pedido)}
              </TableCell>
              <TableCell className="text-right font-black text-gray-900">
                S/ {Number(v.total).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onViewDetail(v)}
                  className="hover:text-pink-600 hover:bg-pink-50"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}