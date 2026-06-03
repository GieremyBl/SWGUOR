import { useContext } from 'react';
import { PortalContext, PortalCtxProps } from '@/components/portal/_contexts/PortalContext';

/**
 * Hook personalizado para acceder al estado global, las cotizaciones y el carrito
 * del portal B2B / Corporativo.
 */
export function usePortal(): PortalCtxProps {
    const ctx = useContext(PortalContext);

    if (!ctx) {
        throw new Error('usePortal debe ser utilizado obligatoriamente dentro de un PortalProvider');
    }

    return ctx;
}