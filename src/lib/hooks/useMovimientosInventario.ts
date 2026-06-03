'use client';

import { useCallback } from "react";
import { toast } from "sonner";
import type { CrearMovimientoInput } from "@/lib/schemas/movimientos-inventario";

export function useMovimientosInventario() {
  
 const registrarMovimiento = useCallback(
    async (params: CrearMovimientoInput) => {
      try {
        const dataLimpia = {} as CrearMovimientoInput;

        Object.keys(params).forEach((key) => {
          const value = params[key as keyof CrearMovimientoInput];
          if (value !== null && value !== undefined) {
            (dataLimpia as Record<string, unknown>)[key] = value;
          }
        });

        const response = await fetch("/api/admin/movimientos-inventario", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataLimpia),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Error al registrar movimiento");
        }

        const data = await response.json();
        toast.success("Movimiento de inventario registrado");
        return data.data;
      } catch (error) {
        console.error("Error registrando movimiento:", error);
        const mensajeError = error instanceof Error ? error.message : "Error al registrar movimiento";
        toast.error(mensajeError);
        throw error;
      }
    },
    []
  );

  /**
   * Registro de Compras (Ingreso de insumos o materiales)
   */
  const registrarCompra = useCallback(
    async (params: {
      almacen_id: string | number;
      insumo_id?: string | number;
      material_id?: string | number;
      cantidad: number;
      motivo?: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        insumo_id: params.insumo_id,
        material_id: params.material_id,
        cantidad: params.cantidad,
        tipo_movimiento: "entrada", // Mapea a 'entrada' pura de compra
        referencia_tipo: "ORDEN_COMPRA",
        motivo: params.motivo || "Ingreso por compra a proveedor",
      });
    },
    [registrarMovimiento]
  );

  /**
   * Devolución a Proveedor (Egreso físico de stock defectuoso)
   */
  const registrarDevolucionProveedor = useCallback(
    async (params: {
      almacen_id: string | number;
      insumo_id?: string | number;
      material_id?: string | number;
      cantidad: number;
      motivo: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        insumo_id: params.insumo_id,
        material_id: params.material_id,
        cantidad: params.cantidad,
        tipo_movimiento: "devolucion_a_proveedor", 
        referencia_tipo: "DEVOLUCION",
        motivo: `Devolución a proveedor: ${params.motivo}`,
      });
    },
    [registrarMovimiento]
  );

  /**
   * Venta / Despacho a Cliente (Salida de productos terminados)
   */
  const registrarVenta = useCallback(
    async (params: {
      almacen_id: string | number;
      producto_id: string | number;
      cantidad: number;
      motivo?: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        producto_id: params.producto_id,
        cantidad: params.cantidad,
        tipo_movimiento: "salida", // Salida comercial común
        referencia_tipo: "PEDIDO_CLIENTE",
        motivo: params.motivo || "Salida por despacho de venta",
      });
    },
    [registrarMovimiento]
  );

  /**
   * Devolución de Cliente (Reingreso de producto al almacén)
   */
  const registrarDevolucionCliente = useCallback(
    async (params: {
      almacen_id: string | number;
      producto_id: string | number;
      cantidad: number;
      motivo: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        producto_id: params.producto_id,
        cantidad: params.cantidad,
        tipo_movimiento: "devolucion_a_cliente",
        referencia_tipo: "DEVOLUCION",
        motivo: `Devolución de cliente: ${params.motivo}`,
      });
    },
    [registrarMovimiento]
  );

  /**
   * Consumo en Fabricación (Salida de materia prima al área de confección)
   */
  const registrarConsumoFabricacion = useCallback(
    async (params: {
      almacen_id: string | number;
      insumo_id?: string | number;
      material_id?: string | number;
      cantidad: number;
      motivo?: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        insumo_id: params.insumo_id,
        material_id: params.material_id,
        cantidad: params.cantidad,
        tipo_movimiento: "consumo_orden_produccion",
        referencia_tipo: "ORDEN_PRODUCCION",
        motivo: params.motivo || "Materia prima enviada a línea de confección",
      });
    },
    [registrarMovimiento]
  );

  /**
   * Ajuste de Inventario Manual (Ingreso directo de regularización)
   */
  const registrarIngresoStock = useCallback(
    async (params: {
      almacen_id: string | number;
      insumo_id?: string | number;
      material_id?: string | number;
      producto_id?: string | number;
      cantidad: number;
      motivo?: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        insumo_id: params.insumo_id,
        material_id: params.material_id,
        producto_id: params.producto_id,
        cantidad: params.cantidad,
        tipo_movimiento: "ajuste", // Ajuste positivo
        referencia_tipo: "AJUSTE_MANUAL",
        motivo: params.motivo || "Corrección de stock mediante ajuste físico manual",
      });
    },
    [registrarMovimiento]
  );

  /**
   * Registro de Incidencias en Taller / Daños / Mermas
   */
  const registrarIncidencia = useCallback(
    async (params: {
      almacen_id: string | number;
      insumo_id?: string | number;
      material_id?: string | number;
      producto_id?: string | number;
      cantidad: number;
      motivo: string;
    }) => {
      return registrarMovimiento({
        almacen_id: params.almacen_id,
        insumo_id: params.insumo_id,
        material_id: params.material_id,
        producto_id: params.producto_id,
        cantidad: params.cantidad,
        tipo_movimiento: "incidencia_taller",
        referencia_tipo: "MERMA_INCIDENCIA",
        motivo: `Incidencia en taller: ${params.motivo}`,
      });
    },
    [registrarMovimiento]
  );

  return {
    registrarMovimiento,
    registrarCompra,
    registrarDevolucionProveedor,
    registrarVenta,
    registrarDevolucionCliente,
    registrarConsumoFabricacion,
    registrarIngresoStock,
    registrarIncidencia,
  };
}