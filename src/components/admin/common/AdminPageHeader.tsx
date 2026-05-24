import { Button } from "@/components/ui/button";
import { Plus, LucideIcon } from "lucide-react";
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
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div>
        <h1 className="text-3xl font-bold text-guor-ink tracking-tight">{title}</h1>
        {description && <p className="text-guor-soft text-sm mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {showAction && onAction && actionLabel && (
          <Button
            onClick={onAction}
            className="bg-guor-600 hover:bg-guor-700 shadow-lg font-bold gap-2 h-11 px-6 text-white active:scale-95 rounded-xl transition-all"
          >
            <Icon className="w-5 h-5" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}