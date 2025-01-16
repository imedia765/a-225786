import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Wallet,
  LogOut
} from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/components/ui/use-toast";

interface SidePanelProps {
  onTabChange: (tab: string) => void;
  userRole?: string;
}

const SidePanel = ({ onTabChange }: SidePanelProps) => {
  const { handleSignOut } = useAuthSession();
  const { userRole, hasRole, permissions } = useRoleAccess();
  const { toast } = useToast();
  
  console.log('SidePanel rendered with role:', userRole);
  
  const handleLogoutClick = () => {
    handleSignOut(false);
  };

  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', tab, 'Current role:', userRole);
    
    // Define role-based access rules
    const tabAccess = {
      dashboard: ['admin', 'collector', 'member'],
      users: ['admin', 'collector'],
      financials: ['admin'],
      system: ['admin']
    };

    const hasAccess = tabAccess[tab]?.includes(userRole);

    if (hasAccess) {
      onTabChange(tab);
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <div className="p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-white">
          Dashboard
        </h2>
        <p className="text-sm text-dashboard-muted">
          Manage your account
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-4 lg:px-6">
        <div className="space-y-1.5">
          {/* Dashboard - Always visible */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          {/* Members - Only for admins and collectors */}
          {(hasRole('admin') || hasRole('collector')) && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('users')}
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
          )}

          {/* Financials - Only for admins */}
          {hasRole('admin') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('financials')}
            >
              <Wallet className="h-4 w-4" />
              Collectors & Financials
            </Button>
          )}

          {/* System - Only for admins */}
          {hasRole('admin') && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('system')}
            >
              <Settings className="h-4 w-4" />
              System
            </Button>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 border-t border-dashboard-cardBorder">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-dashboard-muted hover:text-white"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;