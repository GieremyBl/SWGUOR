"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, FileText, Ruler, Package2, Edit,
  Clock, RefreshCw, DollarSign, Layers, AlertCircle, Upload,
} from "lucide-react";
import dynamic from "next/dynamic";
import ImagenGeometralExtractor from "@/components/admin/common/ImagenGeometralExtractor";
import { ESTADOS_FICHA } from "@/lib/constants/fichas-tecnicas";
import type { EstadoFicha } from "@prisma/client";

const EditFichaDialog    = dynamic(() => import("@/components/admin/fichas-tecnicas/EditFichaDialog"));
const MedidasEditor      = dynamic(() => import("@/components/admin/fichas-tecnicas/MedidasEditor"));
const DetallesMateriales = dynamic(() => import("@/components/admin/fichas-tecnicas/DetallesMateriales"));
const MedidasUploadSheet = dynamic(() => import("@/components/admin/fichas-tecnicas/MedidasUploadSheet"));

const FICHA_DETALLE_KEY = "ficha-tecnica-detalle";

async function fetchFichaPorId(id: string) {
  const res  = await fetch(`/api/admin/fichas-tecnicas/${id}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body.data;
}

// ── Tipos ──────────────────────────────────────────────────────
type TabKey = "info" | "medidas" | "materiales";

interface MedidaExtraida {
  punto_medida: string;
  talla: string;
  valor_cm: number;
  tolerancia?: number;
}

interface MaterialExtraido {
  nombre: string;
  composicion: string;
  porcentaje?: number;
}

interface DatosExtraidos {
  descripcion?: string;
  sam_total?: number;
  costo_estimado?: number;
  tallas_disponibles: string[];
  colores_disponibles: string[];
  medidas: MedidaExtraida[];
  materiales?: MaterialExtraido[];
}

// ── Página principal ───────────────────────────────────────────
export default function FichaTecnicaDetallePage() {
  const { id }           = useParams<{ id: string }>();
  const router           = useRouter();
  const qc               = useQueryClient();
  const { can, hasRole } = usePermissions();

  const [activeTab,          setActiveTab]          = useState<TabKey>("info");
  const [editOpen,           setEditOpen]           = useState(false);
  const [geometralOpen,      setGeometralOpen]      = useState(false);
  const [medidasUploadOpen,  setMedidasUploadOpen]  = useState(false);

  // Datos extraídos por la IA — se usan para previsualizar antes de guardar
  const [datosExtraidos,     setDatosExtraidos]     = useState<DatosExtraidos | null>(null);
  const [imagenGeometralUrl, setImagenGeometralUrl] = useState<string | null>(null);
  const [guardandoDatos,     setGuardandoDatos]     = useState(false);

  const canEdit          = can("edit", "ficha_tecnica");
  const canUploadFicha   = hasRole("disenador") || canEdit;
  const canUploadMedidas = hasRole("cortador")  || canEdit;

  const { data: ficha, isLoading, refetch } = useQuery({
    queryKey: [FICHA_DETALLE_KEY, id],
    queryFn:  () => fetchFichaPorId(id),
    enabled:  !!id,
    refetchOnWindowFocus: false,
  });

  // ── Guardar datos extraídos en BD ──────────────────────────
  const handleGuardarDatosExtraidos = async () => {
    if (!datosExtraidos) return;
    setGuardandoDatos(true);

    try {
      // 1. Actualizar ficha técnica principal
      const bodyFicha: Record<string, any> = {};
      if (datosExtraidos.sam_total)      bodyFicha.sam_total      = datosExtraidos.sam_total;
      if (datosExtraidos.costo_estimado) bodyFicha.costo_estimado = datosExtraidos.costo_estimado;
      if (datosExtraidos.descripcion)    bodyFicha.descripcion_detallada = datosExtraidos.descripcion;
      if (imagenGeometralUrl)            bodyFicha.imagen_geometral = imagenGeometralUrl;

      if (Object.keys(bodyFicha).length > 0) {
        await fetch(`/api/admin/fichas-tecnicas/${id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(bodyFicha),
        });
      }

      // 2. Guardar medidas en ficha_medidas
      if (datosExtraidos.medidas?.length > 0) {
        await fetch('/api/admin/fichas-tecnicas/medidas', {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ 
            ficha_id: id, 
            medidas: datosExtraidos.medidas 
          }),
        });
      }

      qc.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, id] });
      setGeometralOpen(false);
      setDatosExtraidos(null);
    } catch (err) {
      console.error("Error al guardar datos extraídos:", err);
    } finally {
      setGuardandoDatos(false);
    }
  };

  // ── Loading / Not found ────────────────────────────────────
  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Cargando ficha…</p>
    </div>
  );

  if (!ficha) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <FileText className="w-16 h-16 text-slate-200" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Ficha no encontrada</p>
      <Button variant="outline" onClick={() => router.back()}>Volver</Button>
    </div>
  );

  const estadoInfo = ESTADOS_FICHA[ficha.estado as EstadoFicha] ?? ESTADOS_FICHA.borrador;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline" size="icon"
              onClick={() => router.push("/admin/Panel-Administrativo/fichas-tecnicas")}
              className="h-9 w-9 border-slate-200 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900">
                  {ficha.productos?.nombre ?? "Ficha Técnica"}
                </h1>
                <span className="text-lg font-mono text-slate-400">v{ficha.version}</span>
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border ${estadoInfo.color}`}
                >
                  {estadoInfo.label}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                SKU: <span className="font-mono font-semibold">{ficha.productos?.sku ?? "—"}</span>
                {ficha.descripcion_detallada && (
                  <span className="ml-2 text-slate-400">· {ficha.descripcion_detallada}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="icon"
              onClick={() => refetch()}
              className="h-9 w-9 border-slate-200"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {canEdit && (
              <Button
                onClick={() => setEditOpen(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold gap-2 h-10 px-5 active:scale-95"
              >
                <Edit className="w-4 h-4" /> Editar ficha
              </Button>
            )}
          </div>
        </div>

        {/* ── Mini stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat icon={<Ruler size={16} />}      label="Medidas"      value={`${ficha.ficha_medidas?.length ?? 0} puntos`}                                          color="blue"    />
          <MiniStat icon={<Layers size={16} />}     label="Materiales"   value={`${ficha.fichas_tecnicas_detalle?.length ?? 0} items`}                                 color="purple"  />
          <MiniStat icon={<Clock size={16} />}      label="SAM total"    value={ficha.sam_total ? `${ficha.sam_total} min` : "—"}                                      color="orange"  />
          <MiniStat icon={<DollarSign size={16} />} label="Costo estim." value={ficha.costo_estimado ? `S/ ${Number(ficha.costo_estimado).toFixed(2)}` : "—"}          color="emerald" />
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 shadow-sm p-1.5 w-fit">
          <TabPill active={activeTab === "info"}       onClick={() => setActiveTab("info")}       icon={<FileText size={15} />} label="Info general"         />
          <TabPill active={activeTab === "medidas"}    onClick={() => setActiveTab("medidas")}    icon={<Ruler size={15} />}    label="Medidas"              />
          <TabPill active={activeTab === "materiales"} onClick={() => setActiveTab("materiales")} icon={<Package2 size={15} />} label="Materiales e Insumos" />
        </div>

        {/* ── TAB: INFO ──────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="space-y-4">

            {/* Alerta diseñador */}
            {canUploadFicha && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">Diseñador: Sube la imagen geometral</p>
                  <p className="text-xs text-blue-700 mt-1">
                    La IA extraerá automáticamente medidas, materiales, SAM y costo estimado.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 ml-auto shrink-0"
                  onClick={() => setGeometralOpen(true)}
                >
                  <Upload className="w-4 h-4" /> Cargar Geometral
                </Button>
              </div>
            )}

            {/* Alerta cortador */}
            {canUploadMedidas && !canUploadFicha && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-900">Cortador: Sube tu ficha de medidas</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Carga un PDF o una hoja de cálculo con tus medidas para esta prenda.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 ml-auto shrink-0"
                  onClick={() => setMedidasUploadOpen(true)}
                >
                  <Upload className="w-4 h-4" /> Cargar Medidas
                </Button>
              </div>
            )}

            {/* Cards de info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="Producto"       value={ficha.productos?.nombre ?? "—"} />
              <InfoCard label="SKU"            value={ficha.productos?.sku    ?? "—"} mono />
              <InfoCard label="Versión"        value={`v${ficha.version}`}             mono />
              <InfoCard label="Estado"         value={estadoInfo.label} />
              <InfoCard label="SAM total"      value={ficha.sam_total        ? `${ficha.sam_total} min`                          : "No definido"} />
              <InfoCard label="Costo estimado" value={ficha.costo_estimado   ? `S/ ${Number(ficha.costo_estimado).toFixed(2)}`   : "No definido"} />

              {/* Tallas */}
              {ficha.productos?.tallas_disponibles?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Tallas disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {ficha.productos.tallas_disponibles.map((t: string) => (
                      <span key={t} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colores */}
              {ficha.productos?.colores_disponibles?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Colores disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {ficha.productos.colores_disponibles.map((c: string) => (
                      <span key={c} className="px-3 py-1 bg-pink-50 border border-pink-100 rounded-lg text-xs font-bold text-pink-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {ficha.descripcion_detallada && (
                <div className="md:col-span-2">
                  <InfoCard label="Descripción detallada" value={ficha.descripcion_detallada} />
                </div>
              )}

              {/* Imagen geometral guardada */}
              {ficha.imagen_geometral && (
                <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Imagen geometral</p>
                  <img
                    src={ficha.imagen_geometral}
                    alt="Geometral"
                    className="max-h-80 object-contain rounded-lg border border-slate-100 mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: MEDIDAS ───────────────────────────────────── */}
        {activeTab === "medidas" && (
          <MedidasEditor fichaId={id} canEdit={canEdit} />
        )}

        {/* ── TAB: MATERIALES ────────────────────────────────── */}
        {activeTab === "materiales" && (
          <DetallesMateriales fichaId={id} canEdit={canEdit} />
        )}

      </div>

      {/* ── Dialog editar ──────────────────────────────────────── */}
      {editOpen && ficha && (
        <EditFichaDialog
          isOpen={editOpen}
          ficha={ficha}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, id] });
            setEditOpen(false);
          }}
        />
      )}

      {/* ── Sheet: Imagen Geometral (Diseñador) ────────────────── */}
      {geometralOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[92vh] overflow-y-auto rounded-t-3xl shadow-2xl">

            {/* Header del sheet */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">Imagen Geometral</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  La IA extraerá medidas, materiales, SAM y costo estimado automáticamente
                </p>
              </div>
              <button
                onClick={() => { setGeometralOpen(false); setDatosExtraidos(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Extractor */}
              <ImagenGeometralExtractor
                productoId={ficha.id_producto}
                fichaId={id}
                onExtract={(data, imagenUrl) => {
                  if (data)      setDatosExtraidos(data);
                  if (imagenUrl) setImagenGeometralUrl(imagenUrl);
                }}
              />

              {/* Preview de datos extraídos */}
              {datosExtraidos && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Datos extraídos — revisa antes de guardar
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {datosExtraidos.sam_total && (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">SAM total</p>
                        <p className="text-sm font-black text-orange-700">{datosExtraidos.sam_total} min</p>
                      </div>
                    )}
                    {datosExtraidos.costo_estimado && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Costo estimado</p>
                        <p className="text-sm font-black text-emerald-700">S/ {datosExtraidos.costo_estimado}</p>
                      </div>
                    )}
                  </div>

                  {/* Tallas del producto */}
                  {datosExtraidos.tallas_disponibles?.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                        Tallas (desde producto)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {datosExtraidos.tallas_disponibles.map((t) => (
                          <span key={t} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colores del producto */}
                  {datosExtraidos.colores_disponibles?.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                        Colores (desde producto)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {datosExtraidos.colores_disponibles.map((c) => (
                          <span key={c} className="px-3 py-1 bg-pink-50 border border-pink-100 rounded-lg text-xs font-bold text-pink-700">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medidas extraídas */}
                  {datosExtraidos.medidas?.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest p-3 border-b border-slate-100">
                        Medidas extraídas ({datosExtraidos.medidas.length})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left p-2 font-black text-slate-400 uppercase tracking-wider">Punto</th>
                              <th className="text-left p-2 font-black text-slate-400 uppercase tracking-wider">Talla</th>
                              <th className="text-left p-2 font-black text-slate-400 uppercase tracking-wider">Valor cm</th>
                              <th className="text-left p-2 font-black text-slate-400 uppercase tracking-wider">Tolerancia</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datosExtraidos.medidas.map((m, i) => (
                              <tr key={i} className="border-t border-slate-50">
                                <td className="p-2 font-semibold text-slate-700">{m.punto_medida}</td>
                                <td className="p-2 text-slate-500">{m.talla}</td>
                                <td className="p-2 text-slate-700 font-bold">{m.valor_cm} cm</td>
                                <td className="p-2 text-slate-400">{m.tolerancia ? `±${m.tolerancia}` : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Botón guardar */}
                  <Button
                    onClick={handleGuardarDatosExtraidos}
                    disabled={guardandoDatos}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black gap-2 h-12"
                  >
                    {guardandoDatos ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                    ) : (
                      "Guardar datos en la ficha"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Sheet: Medidas Cortador ─────────────────────────────── */}
      {medidasUploadOpen && (
        <MedidasUploadSheet
          fichaId={id}
          onClose={() => setMedidasUploadOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: [FICHA_DETALLE_KEY, id] });
            setMedidasUploadOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────
const MINI_COLORS: Record<string, { bg: string; icon: string; value: string }> = {
  blue:    { bg: "bg-blue-50    border-blue-100",    icon: "text-blue-500",    value: "text-blue-700"    },
  purple:  { bg: "bg-purple-50  border-purple-100",  icon: "text-purple-500",  value: "text-purple-700"  },
  orange:  { bg: "bg-orange-50  border-orange-100",  icon: "text-orange-500",  value: "text-orange-700"  },
  emerald: { bg: "bg-emerald-50 border-emerald-100", icon: "text-emerald-500", value: "text-emerald-700" },
};

function MiniStat({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  const c = MINI_COLORS[color] ?? MINI_COLORS.blue;
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${c.bg}`}>
      <div className={`shrink-0 ${c.icon}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-sm font-black truncate ${c.value}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── TabPill ──────────────────────────────────────────────────
function TabPill({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 active:scale-95 ${
        active ? "bg-pink-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {icon}{label}
    </button>
  );
}

// ─── InfoCard ─────────────────────────────────────────────────
function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-bold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}