import type { EstadoPedido } from '@prisma/client';

export type EtapaConfig = {
    id: EstadoPedido;
    icon: React.ElementType;
    label: string;
};

export interface TimelineProps {
    estadoActual: EstadoPedido;
}