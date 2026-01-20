"use client";

import { Edit2, Trash2, Mail, Phone, User, ShieldCheck, ShieldAlert } from "lucide-react";

interface ClientesTableProps {
  data: any[];
  onEdit: (c: any) => void;
  onDelete: (c: any) => void;
  onToggleStatus: (c: any) => void;
}

export default function ClientesTable({ 
  data, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: ClientesTableProps) {

  const getEstadoBadge = (activo: boolean) => {
    return activo 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Alineación a la izquierda con padding lateral */}
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider">RUC / DNI</th>
              <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-center">Estado</th>
              <th className="px-6 py-4 text-right font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                  No se encontraron clientes registrados.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  
                  {/* 1. Cliente: Avatar + Texto alineado a la izquierda */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-pink-50 rounded-full border border-pink-100 text-pink-600 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 leading-tight uppercase truncate">
                          {c.razon_social}
                        </div>
                        <div className="text-gray-400 text-[10px]">ID: {c.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Contacto: Alineado a la izquierda */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400"/> {c.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-400"/> {c.telefono || '---'}
                      </span>
                    </div>
                  </td>

                  {/* 3. Documento: Alineado a la izquierda */}
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-700">
                    {c.ruc || "---"}
                  </td>

                  {/* 4. Estado: Mantenemos centrado para equilibrio visual */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getEstadoBadge(c.activo)}`}>
                      {c.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>

                  {/* 5. Acciones: Alineado a la derecha */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <button 
                        onClick={() => onToggleStatus(c)} 
                        title={c.activo ? "Desactivar" : "Activar"}
                        className={`p-2 rounded-lg transition-colors ${c.activo ? 'text-gray-400 hover:text-orange-600' : 'text-gray-400 hover:text-emerald-600'}`}
                      >
                        {c.activo ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>

                      <button 
                        onClick={() => onEdit(c)} 
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => onDelete(c)} 
                        className="p-2 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}