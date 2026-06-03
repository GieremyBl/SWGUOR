interface BadgeProps {
    label: string;
    color: string;
}

export function Badge({ label, color }: BadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${color}`}>
            {label}
        </span>
    );
}