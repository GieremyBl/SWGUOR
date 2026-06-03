import { PortalProvider } from '@/components/portal/_contexts/PortalContext';
import { PortalCartLayout } from '@/components/portal/cart/PortalCartLayout';
import { PortalShell } from '@/components/portal/layout/PortalShell';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalCartLayout>
        <PortalShell>{children}</PortalShell>
      </PortalCartLayout>
    </PortalProvider>
  );
}