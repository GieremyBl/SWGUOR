'use client';

export function ProductoSkeleton() {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 animate-pulse flex flex-col h-full">
            <div className="aspect-[4/5] bg-slate-100 rounded-2xl w-full relative overflow-hidden">
                <div className="absolute top-4 left-4 h-5 w-16 bg-white/60 rounded-full" />
            </div>
            <div className="flex-1 space-y-4">
                <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-full" />
                    <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                    <div className="h-2 bg-slate-50 rounded w-1/4 mt-2" />
                </div>
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <div className="space-y-2">
                            <div className="h-2 bg-slate-100 rounded w-12" />
                            <div className="h-6 bg-slate-100 rounded w-24" />
                        </div>
                        <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
                    </div>
                    <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
                </div>
            </div>
        </div>
    );
}