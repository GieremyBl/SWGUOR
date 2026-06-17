"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

interface Props {
  taller: any;
  onClose: () => void;
}

interface Tarifa {
  id: number;
  taller_id: number;
  tipo_prenda: string;
  proceso: string;
  rango_desde: number;
  rango_hasta: number;
  costo_unitario: number;
  moneda: string;
  estado: string;
}

export default function TarifasModal({
  taller,
  onClose,
}: Props) {
  const supabase = getSupabaseBrowserClient();

  const [tarifas, setTarifas] = useState<Tarifa[]>([]);

  const [tipoPrenda, setTipoPrenda] = useState("");
  const [proceso, setProceso] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [costo, setCosto] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const loadTarifas = async () => {
    const { data, error } = await supabase
      .from("tarifas_talleres")
      .select("*")
      .eq("taller_id", Number(taller.id))
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTarifas(data || []);
  };

  const handleGuardarTarifa = async () => {

  if (
    !tipoPrenda.trim() ||
    !proceso.trim() ||
    !desde ||
    !hasta ||
    !costo
  ) {
    toast.error("Todos los campos son obligatorios");
    return;
  }

  if (Number(desde) > Number(hasta)) {
    toast.error("El rango inicial no puede ser mayor al rango final");
    return;
  }

  if (Number(costo) <= 0) {
    toast.error("El costo debe ser mayor a 0");
    return;
  }

  if (editandoId) {

    const { error } = await supabase
      .from("tarifas_talleres")
      .update({
        tipo_prenda: tipoPrenda,
        proceso,
        rango_desde: Number(desde),
        rango_hasta: Number(hasta),
        costo_unitario: Number(costo),
      })
      .eq("id", editandoId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Tarifa actualizada");

  } else {

    const { error } = await supabase
      .from("tarifas_talleres")
      .insert({
        taller_id: Number(taller.id),
        tipo_prenda: tipoPrenda,
        proceso,
        rango_desde: Number(desde),
        rango_hasta: Number(hasta),
        costo_unitario: Number(costo),
        moneda: "PEN",
        estado: "activo",
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Tarifa registrada correctamente");
  }

  setTipoPrenda("");
  setProceso("");
  setDesde("");
  setHasta("");
  setCosto("");

  setEditandoId(null);

  loadTarifas();
};

const handleEditar = (tarifa: Tarifa) => {

  setEditandoId(tarifa.id);

  setTipoPrenda(tarifa.tipo_prenda);
  setProceso(tarifa.proceso);
  setDesde(String(tarifa.rango_desde));
  setHasta(String(tarifa.rango_hasta));
  setCosto(String(tarifa.costo_unitario));
};

const handleEliminar = async (id: number) => {

  const confirmar = confirm(
    "¿Deseas eliminar esta tarifa?"
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("tarifas_talleres")
    .delete()
    .eq("id", id);

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success("Tarifa eliminada");

  loadTarifas();
};

  useEffect(() => {
    loadTarifas();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#231e1d]">
              Tarifas de Taller
            </h2>

            <p className="text-sm text-gray-500">
              {taller.nombre}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FORMULARIO */}
          <div className="lg:col-span-1 bg-[#fff4e2] rounded-2xl p-5 border border-[#e4c28a]">

            <h3 className="font-bold text-[#231e1d] mb-4">
              Registrar Tarifa
            </h3>

            <div className="space-y-4">

              <div>
                <label className="text-sm font-medium text-[#231e1d]">
                  Tipo de Prenda
                </label>

                <input
                  value={tipoPrenda}
                  onChange={(e) =>
                    setTipoPrenda(e.target.value)
                  }
                  className="w-full mt-1 rounded-xl border p-2"
                  placeholder="Ej: Polo"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#231e1d]">
                  Proceso
                </label>

                <input
                  value={proceso}
                  onChange={(e) =>
                    setProceso(e.target.value)
                  }
                  className="w-full mt-1 rounded-xl border p-2"
                  placeholder="Ej: Costura"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="text-sm font-medium text-[#231e1d]">
                    Desde
                  </label>

                  <input
                    type="number"
                    value={desde}
                    onChange={(e) =>
                      setDesde(e.target.value)
                    }
                    className="w-full mt-1 rounded-xl border p-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#231e1d]">
                    Hasta
                  </label>

                  <input
                    type="number"
                    value={hasta}
                    onChange={(e) =>
                      setHasta(e.target.value)
                    }
                    className="w-full mt-1 rounded-xl border p-2"
                  />
                </div>

              </div>

              <div>
                <label className="text-sm font-medium text-[#231e1d]">
                  Costo Unitario
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={costo}
                  onChange={(e) =>
                    setCosto(e.target.value)
                  }
                  className="w-full mt-1 rounded-xl border p-2"
                  placeholder="0.00"
                />
              </div>

              <Button
                onClick={handleGuardarTarifa}
                className="
                    w-full
                    bg-[#b5854b]
                    hover:bg-[#9c713f]
                    text-white
                "
                >
                {editandoId
                    ? "Actualizar Tarifa"
                    : "Guardar Tarifa"}
                </Button>

            </div>

          </div>

          {/* TABLA */}
          <div className="lg:col-span-2">

            <div className="bg-white border rounded-2xl overflow-hidden">

              <div className="px-4 py-3 border-b bg-[#fbddd3]">
                <h3 className="font-bold text-[#231e1d]">
                  Tarifas Registradas
                </h3>
              </div>

              <table className="w-full">

                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3">
                      Prenda
                    </th>

                    <th className="text-left p-3">
                      Proceso
                    </th>

                    <th className="text-left p-3">
                      Rango
                    </th>

                    <th className="text-left p-3">
                      Tarifa
                    </th>

                    <th className="text-left p-3">
                    Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tarifas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-gray-500"
                      >
                        No hay tarifas registradas
                      </td>
                    </tr>
                  ) : (
                    tarifas.map((tarifa) => (
                      <tr
                        key={tarifa.id}
                        className="border-t"
                      >
                        <td className="p-3">
                          {tarifa.tipo_prenda}
                        </td>

                        <td className="p-3">
                          {tarifa.proceso}
                        </td>

                        <td className="p-3">
                          {tarifa.rango_desde} - {tarifa.rango_hasta}
                        </td>

                        <td className="p-3 font-semibold text-[#b5854b]">
                          S/.{" "}
                          {Number(
                            tarifa.costo_unitario
                          ).toFixed(2)}
                        </td>

                        <td className="p-3">
                            <div className="flex gap-2">

                                <button
                                onClick={() => handleEditar(tarifa)}
                                className="
                                    px-3 py-1 rounded-lg
                                    bg-blue-100
                                    text-blue-700
                                    text-sm
                                "
                                >
                                Editar
                                </button>

                                <button
                                onClick={() =>
                                    handleEliminar(tarifa.id)
                                }
                                className="
                                    px-3 py-1 rounded-lg
                                    bg-red-100
                                    text-red-700
                                    text-sm
                                "
                                >
                                Eliminar
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

        </div>

      </div>
    </div>
  );
}