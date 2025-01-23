import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { memo } from "react";

interface NavItemProps {
  name: string;
  icon: LucideIcon;
  tab: string;
  onClick: () => void;
  disabled?: boolean;
}

const NavItem = memo(({ name, icon: Icon, tab, onClick, disabled }: NavItemProps) => {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 text-sm font-medium",
        "hover:bg-dashboard-hover/10 hover:text-white",
        "transition-colors duration-200"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
      {name}
    </Button>
  );
});

NavItem.displayName = "NavItem";

export default NavItem;