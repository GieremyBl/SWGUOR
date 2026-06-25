"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Package, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Devolucion = {
  id: number;
  cliente: { razon_social: string; email: string };
  producto: { nombre: string; sku: string };
  variante: { talla: string; color: string };
  pedido: { id: number; fecha_pedido: string };
  cantidad: number;
  motivo: string;
  estado_solicitud: string;
  condicion_recibido: string;
  monto_reembolsado: number;
  notas_cliente: string;
  notas_internas: string;
  fotos_url: string[];
  created_at: string;
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En Revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  completada: "Completada",
  anulada: "Anulada",
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  en_revision: "bg-blue-100 text-blue-700",
  aprobada: "bg-green-100 text-green-700",
  completada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-700",
  anulada: "bg-gray-100 text-gray-700",
};

const MOTIVO_LABELS: Record<string, string> = {
  defecto_fabrica: "Defecto de fábrica",
  talla_incorrecta: "Talla incorrecta",
  error_envio: "Error en envío",
  insatisfaccion: "Insatisfacción",
  danado_transporte: "Dañado en transporte",
  otros: "Otros",
};

export default function DevolucionesPage() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [selectedDev, setSelectedDev] = useState<Devolucion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [notasInternas, setNotasInternas] = useState("");
  const [montoReembolsado, setMontoReembolsado] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/devoluciones?estado=${filtroEstado}`);
      const result = await res.json();
      if (result.success) {
        setDevoluciones(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al cargar devoluciones");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filtroEstado]);

  const handleVerDetalle = (dev: Devolucion) => {
    setSelectedDev(dev);
    setShowModal(true);
  };

  const handleValidar = (dev: Devolucion) => {
    setSelectedDev(dev);
    setNotasInternas(dev.notas_internas || "");
    setMontoReembolsado(dev.monto_reembolsado?.toString() || "");
    setShowValidateModal(true);
  };

  const handleAprobar = async () => {
    if (!selectedDev) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/devoluciones/${selectedDev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "aprobada",
          notas_internas: notasInternas,
          monto_reembolsado: parseFloat(montoReembolsado) || 0,
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success("Devolución aprobada correctamente");
        setShowValidateModal(false);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al aprobar devolución");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    if (!selectedDev) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/devoluciones/${selectedDev.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "rechazada",
          notas_internas: notasInternas,
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success("Devolución rechazada");
        setShowValidateModal(false);
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al rechazar devolución");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-50 rounded-xl">
            <Package className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Devoluciones</h1>
            <p className="text-gray-500 text-sm">Gestión de devoluciones de clientes</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input placeholder="Buscar por cliente o producto..." className="pl-10 h-11" />
          </div>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-11 px-4 border rounded-xl text-sm bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="completada">Completadas</option>
          </select>
          
          <Button variant="outline" className="h-11" onClick={fetchData}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : devoluciones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No hay devoluciones registradas
                  </td>
                </tr>
              ) : (
                devoluciones.map((dev) => (
                  <tr key={dev.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">#{dev.id}</td>
                    <td className="px-6 py-4">{dev.cliente?.razon_social || "-"}</td>
                    <td className="px-6 py-4">{dev.producto?.nombre || "-"}</td>
                    <td className="px-6 py-4">{dev.cantidad}</td>
                    <td className="px-6 py-4">{MOTIVO_LABELS[dev.motivo] || dev.motivo}</td>
                    <td className="px-6 py-4">{new Date(dev.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${ESTADO_COLORS[dev.estado_solicitud]}`}>
                        {ESTADO_LABELS[dev.estado_solicitud]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleVerDetalle(dev)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {dev.estado_solicitud === "pendiente" && (
                          <Button variant="ghost" size="sm" onClick={() => handleValidar(dev)}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Devolución #{selectedDev?.id}</DialogTitle>
          </DialogHeader>
          {selectedDev && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-bold">Cliente:</label> {selectedDev.cliente?.razon_social}</div>
                <div><label className="font-bold">Producto:</label> {selectedDev.producto?.nombre}</div>
                <div><label className="font-bold">Talla/Color:</label> {selectedDev.variante?.talla} / {selectedDev.variante?.color}</div>
                <div><label className="font-bold">Cantidad:</label> {selectedDev.cantidad}</div>
                <div><label className="font-bold">Motivo:</label> {MOTIVO_LABELS[selectedDev.motivo]}</div>
                <div><label className="font-bold">Estado:</label> {ESTADO_LABELS[selectedDev.estado_solicitud]}</div>
                <div><label className="font-bold">Condición recibido:</label> {selectedDev.condicion_recibido}</div>
                <div><label className="font-bold">Monto reembolsado:</label> S/ {selectedDev.monto_reembolsado || 0}</div>
                <div className="col-span-2"><label className="font-bold">Notas del cliente:</label> {selectedDev.notas_cliente || "-"}</div>
                <div className="col-span-2"><label className="font-bold">Notas internas:</label> {selectedDev.notas_internas || "-"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Validación */}
      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Devolución #{selectedDev?.id}</DialogTitle>
          </DialogHeader>
          {selectedDev && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p><strong>Cliente:</strong> {selectedDev.cliente?.razon_social}</p>
                <p><strong>Producto:</strong> {selectedDev.producto?.nombre}</p>
                <p><strong>Cantidad:</strong> {selectedDev.cantidad}</p>
                <p><strong>Motivo:</strong> {MOTIVO_LABELS[selectedDev.motivo]}</p>
                <p><strong>Notas del cliente:</strong> {selectedDev.notas_cliente}</p>
              </div>
              
              <div>
                <label className="font-bold text-sm">Notas internas</label>
                <Textarea
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  placeholder="Agregar notas sobre la validación..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="font-bold text-sm">Monto a reembolsar (S/.)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={montoReembolsado}
                  onChange={(e) => setMontoReembolsado(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleAprobar}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={handleRechazar}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}