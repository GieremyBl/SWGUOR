export type CategoriaCotizar = {
  id: number;
  nombre: string;
};

export type VarianteParaCotizar = {
  id: number;
  color: string;
  talla: string;
  stock: number;
  precio_adicional: number;
  sku: string;
};

export type ProductoParaCotizar = {
  id: number;
  nombre: string;
  sku: string;
  moq: number;
  precio: number;
  stock: number;
  imagen: string | null;
  descripcion: string | null;
  categoria: CategoriaCotizar | null;
  variantes: VarianteParaCotizar[];
};

export type ItemCotizacionLocal = {
  producto_id: number;
  variante_id: number;
  nombre: string;
  sku: string;
  color: string;
  talla: string;
  precio_unitario: number;
  cantidad: number;
  stock_disponible: number;
};

export type ItemSolicitudCotizacionInput = {
  producto_id: number;
  variante_id: number;
  cantidad: number;
  precio_unitario: number;
  color_snapshot: string;
  talla_snapshot: string;
};
