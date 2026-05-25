'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Package, SlidersHorizontal, X, Info, Tag, Gift } from 'lucide-react';
import type {
  CampanaCatalogoItem,
  ProductoCampanaBadge,
} from '@/lib/services/portal-promociones-catalogo.service';
import { formatFechaCorta } from '@/lib/helpers/portal-promociones-display';
import { createBrowserClient } from '@supabase/ssr';
import { ProductoCard } from '@/components/portal/ProductoCard';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/helpers/format-helpers';

// ── Brand colors ──────────────────────────────────────────────────
const BRAND = {
  ocre:       '#b5854b',
  ocreDark:   '#9a6e3a',
  ocreLight:  '#fff4e2',
  negro:      '#231e1d',
  negroHover: '#3a3330',
};

// --- COMPONENTE SKELETON (Carga Visual) ---
function ProductoSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 animate-pulse flex flex-col h-full">
      <div className="aspect-[4/5] bg-slate-100 rounded-2xl w-full relative overflow-hidden">
        <div className="absolute top-4 left-4 h-5 w-16 bg-white/60 rounded-full" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded-lg w-full" />
          <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-2 bg-slate-50 rounded w-1/4 mt-2" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <div className="h-2 bg-slate-100 rounded w-12" />
              <div className="h-6 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE MODAL DE DETALLES ---
function DetallesProductoModal({ producto, isOpen, onClose }: any) {
  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">{producto.nombre}</h2>
            <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: BRAND.ocre }}>
              SKU: {producto.sku}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-200 shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <Info size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Descripción</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {producto.descripcion || "Sin descripción técnica disponible."}
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Package size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Variantes Disponibles</h3>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Talla</th>
                    <th className="px-4 py-3 text-right">Precio Ref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {producto.variantes_producto?.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-700 font-medium">{v.color}</td>
                      <td className="px-4 py-3 text-slate-600 italic">{v.talla}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(producto.precio + (v.precio_adicional || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todos');
  const [tallaSel, setTallaSel] = useState('Todas');
  const [colorSel, setColorSel] = useState('Todos');
  const [promocionSel, setPromocionSel] = useState('Todas');
  const [campanas, setCampanas] = useState<CampanaCatalogoItem[]>([]);
  const [productoPromos, setProductoPromos] = useState<
    Record<string, ProductoCampanaBadge[]>
  >({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      const { data: prodsData } = await supabase
        .from('productos')
        .select(`
          *,
          categorias (nombre),
          variantes_producto (*)
        `)
        .eq('estado', 'activo');

      if (prodsData) {
        setProductos(prodsData.map(p => ({
          ...p,
          categoria: p.categorias?.nombre || 'General',
          tallas: [...new Set(p.variantes_producto?.map((v: any) => v.talla))],
          colores: [...new Set(p.variantes_producto?.map((v: any) => v.color))]
        })));
      }
      setLoading(false);
    }

    async function cargarPromociones() {
      try {
        const res = await fetch('/api/portal/promociones-catalogo', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          setCampanas(json.data.campanas ?? []);
          setProductoPromos(json.data.productos ?? {});
        }
      } catch {
        setCampanas([]);
        setProductoPromos({});
      }
    }

    cargarDatos();
    cargarPromociones();
  }, []);

  const categoriasLista = useMemo(() => ['Todos', ...new Set(productos.map(p => p.categoria))], [productos]);
  const tallasLista = useMemo(() => ['Todas', ...new Set(productos.flatMap(p => p.tallas))], [productos]);
  const coloresLista = useMemo(() => ['Todos', ...new Set(productos.flatMap(p => p.colores))], [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.sku.toLowerCase().includes(busqueda.toLowerCase());
      const matchCat = categoriaSel === 'Todos' || p.categoria === categoriaSel;
      const matchTalla = tallaSel === 'Todas' || p.tallas.includes(tallaSel);
      const matchColor = colorSel === 'Todos' || p.colores.includes(colorSel);

      let matchPromo = true;
      if (promocionSel !== 'Todas') {
        const badges = productoPromos[String(p.id)] ?? [];
        matchPromo = badges.some(
          (b) => `${b.tipo}-${b.campana_id}` === promocionSel,
        );
      }

      return matchBusqueda && matchCat && matchTalla && matchColor && matchPromo;
    });
  }, [busqueda, categoriaSel, tallaSel, colorSel, promocionSel, productos, productoPromos]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* HEADER BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 transition-all"
            style={{ '--tw-ring-color': BRAND.ocre } as React.CSSProperties}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs font-bold px-4 border-l border-slate-100 uppercase tracking-tighter">
          <SlidersHorizontal size={16} />
          {productosFiltrados.length} Resultados
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* PANEL DE FILTROS */}
        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-8 sticky top-8">
            {campanas.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Promociones y ofertas
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPromocionSel('Todas')}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold transition-all')}
                    style={{
                      backgroundColor: promocionSel === 'Todas' ? BRAND.ocre : '#f1f5f9',
                      color: promocionSel === 'Todas' ? '#fff' : '#64748b',
                    }}
                  >
                    Todas
                  </button>
                  {campanas.map((c) => {
                    const key = `${c.tipo}-${c.id}`;
                    const activa = promocionSel === key;
                    const Icon = c.tipo === 'oferta' ? Gift : Tag;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        title={`${c.nombre} · ${formatFechaCorta(c.fecha_inicio)}${c.fecha_fin ? ` — ${formatFechaCorta(c.fecha_fin)}` : ''}`}
                        onClick={() => setPromocionSel(key)}
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all max-w-full',
                        )}
                        style={{
                          backgroundColor: activa
                            ? c.tipo === 'oferta'
                              ? BRAND.negro
                              : BRAND.ocre
                            : '#f1f5f9',
                          color: activa ? '#fff' : '#64748b',
                        }}
                      >
                        <Icon size={12} />
                        <span className="truncate">{c.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Categorías</h3>
              <div className="flex flex-wrap gap-2">
                {categoriasLista.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setCategoriaSel(cat)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-bold transition-all")}
                    style={{
                      backgroundColor: categoriaSel === cat ? BRAND.ocre : '#f1f5f9',
                      color: categoriaSel === cat ? '#fff' : '#64748b',
                    }}
                    onMouseEnter={(e) => {
                      if (categoriaSel !== cat) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (categoriaSel !== cat) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
                      }
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tallas</h3>
              <div className="grid grid-cols-3 gap-2">
                {tallasLista.map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTallaSel(t)}
                    className="py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: tallaSel === t ? BRAND.ocre : '#e2e8f0',
                      backgroundColor: tallaSel === t ? BRAND.ocreLight : 'transparent',
                      color: tallaSel === t ? BRAND.ocre : '#64748b',
                    }}
                    onMouseEnter={(e) => {
                      if (tallaSel !== t) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tallaSel !== t) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Colores</h3>
              <div className="flex flex-wrap gap-2">
                {coloresLista.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setColorSel(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={{
                      borderColor: colorSel === c ? BRAND.negro : '#e2e8f0',
                      backgroundColor: colorSel === c ? BRAND.negro : 'transparent',
                      color: colorSel === c ? '#fff' : '#64748b',
                    }}
                    onMouseEnter={(e) => {
                      if (colorSel !== c) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (colorSel !== c) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* LISTA DE PRODUCTOS */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <ProductoSkeleton key={i} />)}
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productosFiltrados.map((prod, index) => (
                <div 
                  key={prod.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ 
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <ProductoCard
                    producto={prod}
                    promociones={productoPromos[String(prod.id)] ?? []}
                    onOpenDetails={() => setProductoSeleccionado(prod)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="font-medium text-sm">No se encontraron productos para esta búsqueda.</p>
              <button 
                onClick={() => {
                  setBusqueda('');
                  setCategoriaSel('Todos');
                  setTallaSel('Todas');
                  setColorSel('Todos');
                  setPromocionSel('Todas');
                }} 
                className="mt-4 text-sm font-bold uppercase underline decoration-2 underline-offset-4 transition-colors"
                style={{ color: BRAND.ocre }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = BRAND.ocreDark}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = BRAND.ocre}
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <DetallesProductoModal 
        producto={productoSeleccionado}
        isOpen={!!productoSeleccionado}
        onClose={() => setProductoSeleccionado(null)}
      />
    </div>
  );
}