
interface GoalCardProps {
  label: string;
  pct: number;
  current: string;
  target: string;
  color?: string;
}
 
export function GoalCard({
  label,
  pct,
  current,
  target,
  color = '#e11d48',
}: GoalCardProps) {
  return (
    <div
      className="rounded-3xl p-5 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
    >
      <div className="relative z-10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.18em] mb-4 opacity-80">
          {label}
        </h4>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-black">{pct}%</span>
          <span className="text-[10px] font-bold opacity-70 mb-1">
            {current} de {target}
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
 
export default GoalCard;