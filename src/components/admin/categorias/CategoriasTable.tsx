"use client";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Categoria } from "@/types/supabase.types";

interface Props {
  data: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (categoria: Categoria) => void;
}

export default function CategoriasTable({ data, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-bold">Nombre</TableHead>
            <TableHead className="font-bold">Descripción</TableHead>
            <TableHead className="font-bold text-center">Estado</TableHead>
            <TableHead className="font-bold text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                No se encontraron categorías.
              </TableCell>
            </TableRow>
          ) : (
            data.map((categoria) => (
              <TableRow key={categoria.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium text-gray-900">
                  {categoria.nombre}
                </TableCell>
                <TableCell className="max-w-75 truncate text-gray-600">
                  {categoria.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                </TableCell>
                <TableCell className="text-center">
                  {categoria.activo ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" /> Inactivo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onEdit(categoria)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(categoria)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}