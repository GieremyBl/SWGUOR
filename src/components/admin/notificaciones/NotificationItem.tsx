'use client';

import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, FileText, CheckCircle, RefreshCw, CreditCard, Layers } from 'lucide-react';
import type { Notificacion } from '@/lib/schemas/notificaciones';

// Configuración de Iconos según el tipo nativo de Supabase
const ICONO_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  stock_bajo: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  pedido_vencido: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
  pago_pendiente: { icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  cotizacion_expirada: { icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
  orden_produccion: { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  confeccion_completada: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
  devolucion_solicitada: { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  sistema: { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
};

interface NotificationItemProps {
  notificacion: Notificacion;
  onMarcarComoLeido?: (id: string | number | bigint) => void;
  compacto?: boolean;
}

export function NotificationItem({ notificacion: n, onMarcarComoLeido, compacto = false }: NotificationItemProps) {
  const router = useRouter();
  const config = ICONO_CONFIG[n.tipo] ?? ICONO_CONFIG.sistema;
  const Icono = config.icon;

  const manejarRedireccion = () => {
    // Si la alerta tiene una acción de lectura asociada, la disparamos
    if (!n.leido && onMarcarComoLeido) {
      onMarcarComoLeido(n.id);
    }   

    // Deep Linking utilizando el nuevo Enum relacional que mapeamos
    if (n.referencia_tipo && n.referencia_id) {
      const rutas: Record<string, string> = {
        PRODUCTO: `/admin/inventario/productos/${n.referencia_id}`,
        COTIZACION: `/admin/ventas/cotizaciones/${n.referencia_id}`,
        ORDEN_PRODUCCION: `/admin/taller/ordenes/${n.referencia_id}`,
        PAGO: `/admin/finanzas/pagos/${n.referencia_id}`,
        PEDIDO: `/admin/ventas/pedidos/${n.referencia_id}`,
        SISTEMA: `/admin/dashboard`
      };
      
      const destino = rutas[n.referencia_tipo] || `/admin/dashboard`;
      router.push(destino);
    } else if (n.url_destino) {
      router.push(n.url_destino);
    }
  };

  return (
    <div
      onClick={manejarRedireccion}
      className={`flex gap-3 p-3.5 border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all ${
        !n.leido ? 'bg-indigo-50/20' : 'opacity-70'
      }`}
    >
      {/* Círculo del Icono Adaptativo */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${config.bg}`}>
        <Icono className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Contenido Textual */}
      <div className="flex-1 space-y-0.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold tracking-tight truncate ${!n.leido ? 'text-slate-900' : 'text-slate-600'}`}>
            {n.titulo}
          </p>
          {!n.leido && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 block" />
          )}
        </div>
        
        <p className={`text-xs leading-relaxed text-slate-500 ${compacto ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {n.mensaje}
        </p>

        <span className="text-[10px] font-medium text-slate-400 block pt-0.5">
          {new Date(n.created_at).toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
}