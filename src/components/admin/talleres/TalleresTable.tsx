"use client";

import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, MoreHorizontal, Phone, MapPin } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ESPECIALIDAD_TALLER_LABELS } from "@/lib/constants/talleres";
import type { Taller } from "@/lib/schemas/talleres";

export type { Taller };

interface TalleresTableProps {
  data:      Taller[];
  canEdit:   boolean;
  canDelete: boolean;
  onDelete:  (taller: Taller) => void;
  onEdit:    (taller: Taller) => void;
  onView:    (taller: Taller) => void;
}

const STATUS_STYLES: Record<string, string> = {
  activo:     "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  inactivo:   "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  suspendido: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
};

export default function TalleresTable({
  data, canEdit, canDelete, onDelete, onEdit, onView
}: TalleresTableProps) {

  if (data.length === 0) {
    return (
      <div className="bg-white p-10 text-center rounded-2xl border border-dashed">
        <p className="text-gray-400 font-medium">No se encontraron talleres con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="font-bold text-gray-900">Taller / RUC</TableHead>
            <TableHead className="font-bold text-gray-900">Contacto</TableHead>
            <TableHead className="font-bold text-gray-900">Especialidad</TableHead>
            <TableHead className="font-bold text-gray-900">Estado</TableHead>
            <TableHead className="text-right font-bold text-gray-900">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((taller) => {
            const estadoKey = taller.estado?.toLowerCase() ?? "";
            
            const direccionTexto = taller.direccion ?? "";
            const direccionTruncada = direccionTexto.length > 25 
              ? `${direccionTexto.substring(0, 25)}...` 
              : direccionTexto;

            return (
              <TableRow key={taller.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 uppercase italic tracking-tighter">
                      {taller.nombre}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{taller.ruc}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <Phone className="w-3 h-3 mr-1 text-pink-500 shrink-0" /> {taller.telefono}
                    </div>
                    {direccionTexto && (
                      <div className="flex items-center text-[10px] text-gray-400">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" /> {direccionTruncada}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-100 capitalize">
                    {taller.especialidad
                      ? ESPECIALIDAD_TALLER_LABELS[taller.especialidad as keyof typeof ESPECIALIDAD_TALLER_LABELS] ?? taller.especialidad
                      : '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${STATUS_STYLES[estadoKey] || "bg-gray-100 text-gray-600 border-gray-200"} capitalize border shadow-none`}>
                    {taller.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                      <DropdownMenuItem onClick={() => onView(taller)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver detalle
                      </DropdownMenuItem>

                      {canEdit && (
                        <DropdownMenuItem onClick={() => onEdit(taller)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(taller)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Suspender
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}