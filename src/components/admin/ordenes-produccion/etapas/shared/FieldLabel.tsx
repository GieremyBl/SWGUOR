interface FieldLabelProps {
    children: React.ReactNode;
    required?: boolean;
}

export function FieldLabel({ children, required }: FieldLabelProps) {
    return (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {children} {required && <span className="text-rose-400">*</span>}
        </label>
    );
}