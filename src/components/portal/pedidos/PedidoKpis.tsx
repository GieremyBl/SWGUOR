import { Package, Zap, CheckCircle2, Truck } from 'lucide-react';

interface Props {
  total: number;
  activos: number;
  listos: number;
  entregados: number;
}

export function PedidoKpis({ total, activos, listos, entregados }: Props) {
  const items = [
    {
      label: 'Total Órdenes',
      value: total,
      icon: Package,
      descripcion: 'Historial completo',
    },
    {
      label: 'En Proceso',
      value: activos,
      icon: Zap,
      descripcion: 'Pendiente o producción',
    },
    {
      label: 'Listos',
      value: listos,
      icon: CheckCircle2,
      descripcion: 'Para despacho',
    },
    {
      label: 'Entregados',
      value: entregados,
      icon: Truck,
      descripcion: 'Completados',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="group relative bg-guor-surface border border-guor-line rounded-2xl p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ boxShadow: '0 1px 4px 0 rgb(26 20 16 / 0.06)' }}
          >
            {/* Acento izquierdo gold */}
            <div
              className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full transition-all duration-300 opacity-40 group-hover:opacity-100 group-hover:top-2 group-hover:bottom-2 bg-guor-gold"
            />

            {/* Icono flotante de fondo */}
            <div className="absolute -bottom-3 -right-3 transition-all duration-300 opacity-[0.06] group-hover:opacity-[0.10] group-hover:scale-110 text-guor-dark">
              <Icon size={72} />
            </div>

            <div className="relative flex flex-col gap-3">
              {/* Icono pequeño */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 bg-guor-cream-deep text-guor-soft">
                <Icon size={17} />
              </div>

              {/* Número */}
              <div>
                <span className="text-3xl md:text-4xl font-black leading-none tracking-tight transition-colors duration-300 text-guor-ink">
                  {item.value}
                </span>
              </div>

              {/* Labels */}
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-guor-ink">
                  {item.label}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-guor-muted">
                  {item.descripcion}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}