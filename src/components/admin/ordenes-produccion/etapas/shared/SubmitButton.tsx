import { Loader2, ChevronRight } from "lucide-react";

const COLOR_MAP = {
    violet: "bg-violet-600 hover:bg-violet-700",
    amber: "bg-amber-500 hover:bg-amber-600",
    rose: "bg-rose-600 hover:bg-rose-700",
    teal: "bg-teal-600 hover:bg-teal-700",
} as const;

interface SubmitButtonProps {
    loading: boolean;
    onClick: () => void;
    label: string;
    color?: keyof typeof COLOR_MAP;
}

export function SubmitButton({ loading, onClick, label, color = "violet" }: SubmitButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${COLOR_MAP[color]}`}
        >
            {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ChevronRight className="w-4 h-4" />}
            {label}
        </button>
    );
}