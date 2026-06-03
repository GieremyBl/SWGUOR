import { ItemCotizacion, ReglaDescuento, ResumenCotizacion, ZonaEnvio, ZONAS_ENVIO } from './PortalContext';

const IGV = 0.18;

export function resolverDescuento(
    items: ItemCotizacion[],
    reglas: ReglaDescuento[],
    esClienteNuevo: boolean,
): { pct: number; descripcion: string } {
    if (items.length === 0) return { pct: 0, descripcion: 'Sin descuento' };

    const ahora = new Date();
    const reglasActivas = reglas.filter(r =>
        r.activo &&
        new Date(r.fecha_inicio) <= ahora &&
        new Date(r.fecha_fin) >= ahora,
    );

    if (esClienteNuevo) {
        const reglaCliente = reglasActivas.find(r =>
            r.tipo_conteo === 'modelos_distintos' &&
            r.cantidad_min !== null &&
            r.cantidad_min <= 1 &&
            r.valor_descuento === 20,
        );
        if (reglaCliente) return { pct: 20, descripcion: `${reglaCliente.nombre} (20%)` };
    }

    const modelosDistintos = new Set(items.map(i => i.producto_id)).size;
    const reglasEscala = reglasActivas
        .filter(r => r.tipo_conteo === 'modelos_distintos' && (r.cantidad_min ?? 0) > 1)
        .sort((a, b) => (b.cantidad_min ?? 0) - (a.cantidad_min ?? 0));

    const reglaAplicable = reglasEscala.find(r => modelosDistintos >= (r.cantidad_min ?? 0));

    if (reglaAplicable) {
        const pct = reglaAplicable.valor_descuento;
        return { pct, descripcion: `${reglaAplicable.nombre} (${pct}%) — ${modelosDistintos} modelos` };
    }

    return { pct: 0, descripcion: 'Sin descuento por volumen' };
}

export function calcularResumen(
    items: ItemCotizacion[],
    zonaEnvio: ZonaEnvio,
    reglas: ReglaDescuento[],
    esClienteNuevo: boolean,
): ResumenCotizacion {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const total_unidades = items.reduce((s, i) => s + i.cantidad, 0);
    const modelos_distintos = new Set(items.map(i => i.producto_id)).size;

    const { pct: descuento_pct, descripcion: descripcion_descuento } =
        resolverDescuento(items, reglas, esClienteNuevo);

    const descuento_monto = subtotal * (descuento_pct / 100);
    const base_igv = subtotal - descuento_monto;
    const igv = base_igv * IGV;
    const costo_envio = items.length > 0 ? (ZONAS_ENVIO[zonaEnvio]?.costo ?? 0) : 0;

    return {
        subtotal,
        total_unidades,
        modelos_distintos,
        descuento_pct,
        descuento_monto,
        base_igv,
        igv,
        costo_envio,
        total: base_igv + igv + costo_envio,
        descripcion_descuento,
        descripcion_envio: ZONAS_ENVIO[zonaEnvio]?.label ?? '',
        es_cliente_nuevo: esClienteNuevo,
    };
}