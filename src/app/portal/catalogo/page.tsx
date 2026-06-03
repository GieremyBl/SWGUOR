'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePortal } from '@/lib/hooks/usePortal';
import { ProductoPortal } from '@/components/portal/_contexts/PortalContext';
import { FiltrosCatalogo } from '@/components/portal/catalogo/FiltrosCatalogo';
import { ProductoCard } from '@/components/portal/catalogo/ProductoCard';
import { VariantePicker } from '@/components/portal/catalogo/VariantePicker';
import { DetallesProductoModal } from '@/components/portal/catalogo/DetalleProductoModal';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/useCartStore';
import { toast } from 'sonner';

export default function CatalogoPage() {
  const { productos, categorias, loading } = usePortal();
  const addItem = useCartStore((s) => s.addItem);

  // Estados para Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);

  // Encontrar dinámicamente el precio máximo para el slider
  const precioMaximoLimite = useMemo(() => {
    if (!productos || productos.length === 0) return 100;
    return Math.ceil(Math.max(...productos.map((p) => p.precio)));
  }, [productos]);

  const [rangoPrecio, setRangoPrecio] = useState<[number, number]>([0, 100]);

  // Sincronizar el límite del slider cuando carguen los productos
  useEffect(() => {
    if (precioMaximoLimite) {
      setRangoPrecio([0, precioMaximoLimite]);
    }
  }, [precioMaximoLimite]);

  // Estados para el Selector Flotante de Variantes (Pedido Directo)
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoPortal | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string | null>(null);
  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<ProductoPortal | null>(null);

  // Lógica de Filtrado Combinada
  const productosFiltrados = useMemo(() => {
    if (!productos) return [];

    return productos.filter((producto) => {
      // 1. Filtro por Buscador (Query o SKU)
      const cumpleQuery =
        producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (producto.sku && producto.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Filtro por Línea de Colección
      const cumpleCategoria =
        categoriaSeleccionada === null || producto.categoria_id === categoriaSeleccionada;

      // 3. Filtro por Rango de Precio
      const cumplePrecio =
        producto.precio >= rangoPrecio[0] && producto.precio <= rangoPrecio[1];

      // 4. Filtro por Talla Seleccionada
      let cumpleTalla = true;
      if (tallaSeleccionada) {
        const lasTallas = producto.tallas_disponibles;
        if (Array.isArray(lasTallas)) {
          cumpleTalla = (lasTallas as string[])
            .map(t => String(t).toUpperCase())
            .includes(tallaSeleccionada.toUpperCase());
        } else if (typeof lasTallas === 'string') {
          cumpleTalla = (lasTallas as string).toUpperCase().includes(tallaSeleccionada.toUpperCase());
        } else {
          cumpleTalla = false;
        }
      }

      // 5. Filtro por Color Seleccionado
      let cumpleColor = true;
      if (colorSeleccionado) {
        const losColores = producto.colores_disponibles;
        if (Array.isArray(losColores)) {
          cumpleColor = (losColores as string[])
            .map(c => String(c).toLowerCase())
            .includes(colorSeleccionado.toLowerCase());
        } else if (typeof losColores === 'string') {
          cumpleColor = (losColores as string).toLowerCase().includes(colorSeleccionado.toLowerCase());
        } else {
          cumpleColor = false;
        }
      }

      return cumpleQuery && cumpleCategoria && cumplePrecio && cumpleTalla && cumpleColor;
    });
  }, [
    productos,
    searchQuery,
    categoriaSeleccionada,
    rangoPrecio,
    tallaSeleccionada,
    colorSeleccionado
  ]);

  // Manejadores de Acción
  const handleAbrirPicker = (producto: ProductoPortal) => {
    setProductoSeleccionado(producto);
    setIsPickerOpen(true);
  };

  const handleConfirmarAgregar = async (varianteId: number, producto: ProductoPortal, cantidad: number) => {
    try {
      const lasVariantes = producto.variantes ?? producto.variantes_producto ?? [];
      const varianteElegida = lasVariantes.find((v) => v.id === varianteId);

      if (!varianteElegida) {
        toast.error('La combinación seleccionada no se encuentra disponible.');
        return;
      }

      addItem({
        producto_id: producto.id,
        variante_id: varianteElegida.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        moq: producto.moq,
        imagen_url: producto.imagen || null,
        color: varianteElegida.color || 'Estándar',
        talla: varianteElegida.talla || 'U',
      }, cantidad);

      toast.success(`¡${producto.nombre} añadido correctamente a tu pedido!`, {
        description: `Variante: ${varianteElegida.color.toUpperCase()} · Talla ${varianteElegida.talla.toUpperCase()} (${cantidad} uds)`,
      });

    } catch (err: unknown) {
      console.error('Error al agregar ítem al pedido:', err);
      toast.error('No se pudo añadir el producto. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--guor-gold)' }} />
        <p className="text-xs font-bold uppercase tracking-widest opacity-50" style={{ color: 'var(--guor-dark)' }}>
          Cargando catálogo exclusivo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 text-white rounded-2xl shadow-lg bg-guor-gold shadow-guor-gold/30">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Catálogo Corporativo</h1>
            <p className="text-sm text-slate-500">
              Explore y configure sus solicitudes de producción mayorista en base a nuestro stock real.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl border sticky top-24" style={{ borderColor: 'var(--guor-stone)' }}>
          <FiltrosCatalogo
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoriaSeleccionada={categoriaSeleccionada}
            setCategoriaSeleccionada={setCategoriaSeleccionada}
            categorias={categorias}
            rangoPrecio={rangoPrecio}
            setRangoPrecio={setRangoPrecio}
            precioMaximoLimite={precioMaximoLimite}
            tallaSeleccionada={tallaSeleccionada}
            setTallaSeleccionada={setTallaSeleccionada}
            colorSeleccionado={colorSeleccionado}
            setColorSeleccionado={setColorSeleccionado}
          />
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--guor-dark)' }}>
              {productosFiltrados.length} Modelos encontrados
            </span>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50/50" style={{ borderColor: 'var(--guor-stone)' }}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-40" style={{ color: 'var(--guor-dark)' }}>
                No hay combinaciones que coincidan con la búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {productosFiltrados.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onSelect={handleAbrirPicker}
                  onQuickView={(p) => setProductoDetalle(p)}
                  // CORRECCIÓN CRÍTICA: Enviar las promociones que vienen dentro del objeto producto
                  promociones={(producto as any).badges_campanas || []}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <VariantePicker
        producto={productoSeleccionado}
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setProductoSeleccionado(null);
        }}
        onAgregar={handleConfirmarAgregar}
      />

      <DetallesProductoModal
        producto={productoDetalle}
        isOpen={productoDetalle !== null}
        onClose={() => setProductoDetalle(null)}
      />
    </div>
  );
}