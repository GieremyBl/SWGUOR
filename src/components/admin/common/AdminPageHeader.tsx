import { Button } from "@/components/ui/button";
import { Plus, LucideIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  showAction?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  onBack?: () => void;
}

export default function AdminPageHeader({
  title,
  description,
  actionLabel,
  onAction,
  showAction = true,
  icon: Icon = Plus,
  children,
  className,
  onBack,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div className="flex items-start gap-4">
        {onBack && (
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 border-slate-200 shrink-0 mt-1 rounded-xl hover:bg-white hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-guor-ink tracking-tight">{title}</h1>
          {description && <p className="text-guor-soft text-sm mt-1">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        {showAction && onAction && actionLabel && (
          <Button
            onClick={onAction}
            className="bg-pink-600 hover:bg-pink-700 shadow-lg font-bold gap-2 h-11 px-6 text-white active:scale-95 rounded-xl transition-all"
          >
            <Icon className="w-5 h-5" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}