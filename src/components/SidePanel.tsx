import { useCallback, useMemo, memo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuthSession } from "@/hooks/useAuthSession";
import NavItem from "./navigation/NavItem";

interface SidePanelProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const SidePanel = memo(({ currentTab, onTabChange }: SidePanelProps) => {
  const { session, handleSignOut } = useAuthSession();
  const { userRole, userRoles, roleLoading, hasRole } = useRoleAccess();
  const { toast } = useToast();

  // Use refs to track previous values
  const prevUserRoleRef = useRef(userRole);
  const prevUserRolesRef = useRef(userRoles);

  const hasSession = !!session;

  // Log render causes
  useEffect(() => {
    if (!hasSession) {
      console.log('No active session, access will be restricted');
      return;
    }

    if (prevUserRoleRef.current !== userRole) {
      console.log('SidePanel rerender: userRole changed', { old: prevUserRoleRef.current, new: userRole });
      prevUserRoleRef.current = userRole;
    }
    if (prevUserRolesRef.current !== userRoles) {
      console.log('SidePanel rerender: userRoles changed', { old: prevUserRolesRef.current, new: userRoles });
      prevUserRolesRef.current = userRoles;
    }
  }, [userRole, userRoles, hasSession]);

  // Memoize navigation items with stable reference
  const navigationItems = useMemo(() => [
    {
      name: 'Overview',
      href: '/dashboard',
      tab: 'dashboard',
      alwaysShow: true
    },
    {
      name: 'Users',
      href: '/users',
      tab: 'users',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'Financials',
      href: '/financials',
      tab: 'financials',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'System',
      href: '/system',
      tab: 'system',
      requiresRole: ['admin'] as const
    }
  ], []);

  // Memoize shouldShowTab with stable dependencies
  const shouldShowTab = useCallback((tab: string): boolean => {
    if (!hasSession) return tab === 'dashboard';
    if (roleLoading) return tab === 'dashboard';
    if (!userRoles || !userRole) return tab === 'dashboard';

    switch (tab) {
      case 'dashboard':
        return true;
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
        return hasRole('admin') || hasRole('collector');
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  }, [roleLoading, userRoles, userRole, hasRole, hasSession]);

  // Memoize handleTabChange with stable toast reference
  const handleTabChange = useCallback((tab: string) => {
    console.log('Tab change requested:', tab);
    if (!hasSession) {
      toast({
        title: "Access Denied",
        description: "Please log in to access this feature",
        variant: "destructive"
      });
      return;
    }

    if (roleLoading) {
      toast({
        title: "Please wait",
        description: "Loading access permissions...",
      });
      return;
    }

    if (!shouldShowTab(tab)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this section",
        variant: "destructive"
      });
      return;
    }

    onTabChange(tab);
  }, [roleLoading, shouldShowTab, onTabChange, toast, hasSession]);

  // Memoize logout handler
  const handleLogoutClick = useCallback(async () => {
    console.log('Logout initiated');
    try {
      await handleSignOut(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [handleSignOut, toast]);

  // Memoize role status text
  const roleStatusText = useMemo(() => {
    console.log('Calculating role status text');
    if (!hasSession) return 'Not authenticated';
    if (roleLoading) return 'Loading access...';
    return userRole ? `Role: ${userRole}` : 'Access restricted';
  }, [roleLoading, userRole, hasSession]);

  // Memoize visible navigation items with proper dependencies
  const visibleNavigationItems = useMemo(() => {
    console.log('Calculating visible navigation items');
    if (!hasSession) return navigationItems.filter(item => item.alwaysShow);
    return navigationItems.filter(item => 
      item.alwaysShow || (!roleLoading && item.requiresRole?.some(role => userRoles?.includes(role)))
    );
  }, [navigationItems, roleLoading, userRoles, hasSession]);

  console.log('SidePanel render', { userRole, roleLoading, hasSession });

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <ScrollArea className="flex-1">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold text-dashboard-highlight">
              Navigation
            </h2>
            <div className="space-y-1">
              {visibleNavigationItems.map((item) => (
                <NavItem
                  key={item.tab}
                  name={item.name}
                  href={item.href}
                  isActive={currentTab === item.tab}
                  onClick={() => handleTabChange(item.tab)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-dashboard-cardBorder">
        <p className="text-sm text-dashboard-muted mb-4">{roleStatusText}</p>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogoutClick}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
});

SidePanel.displayName = "SidePanel";

export default SidePanel;