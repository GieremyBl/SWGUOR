import React from 'react';
import { Loader2 } from 'lucide-react';
 
interface Props {
  message?: string;
}
 
export default function DashboardLoader({ message = 'Cargando dashboard...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-rose-500" size={28} />
      <p className="text-stone-400 font-black uppercase text-[10px] tracking-widest">
        {message}
      </p>
    </div>
  );
}