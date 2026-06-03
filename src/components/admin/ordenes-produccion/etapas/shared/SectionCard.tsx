interface SectionCardProps {
    children: React.ReactNode;
    className?: string;
}

export function SectionCard({ children, className = "" }: SectionCardProps) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 ${className}`}>
            {children}
        </div>
    );
}