import type { EstadoPedido } from '@/lib/services/seguimiento-pedido.service';

export type EtapaConfig = {
    id: EstadoPedido;
    icon: React.ElementType;
    label: string;
};

export interface TimelineProps {
    estadoActual: EstadoPedido;
}