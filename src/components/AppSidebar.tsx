import { LayoutDashboard, FolderKanban, Bell, LogOut, Gamepad2, CalendarDays, ClipboardList, ShieldCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  onSignOut?: () => void;
}

export function AppSidebar({ onSignOut }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { data: userRow } = useUserRole(user?.id);
  const role = userRow?.role;

  const mainItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Notifications', url: '/notifications', icon: Bell },
    { title: 'Game', url: '/game', icon: Gamepad2 },
    { title: 'Analytics', url: '/analytics', icon: LayoutDashboard },
  ];

  const leaveItems = [
    { title: 'My Leaves', url: '/leave', icon: CalendarDays },
    ...(role === 'manager' || role === 'admin'
      ? [{ title: 'Manage Leaves', url: '/leave/manage', icon: ClipboardList }]
      : []),
    ...(role === 'admin'
      ? [{ title: 'Admin Panel', url: '/admin', icon: ShieldCheck }]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-foreground" />
              <span className="font-semibold text-sm tracking-tight text-foreground">TaskFlow</span>
            </div>
          ) : (
            <FolderKanban className="h-5 w-5 text-foreground mx-auto" />
          )}
        </div>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent relative" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === 'Notifications' && unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Leave nav */}
        <SidebarGroup>
          <SidebarGroupLabel>Leave</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {leaveItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent relative" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {onSignOut && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <button onClick={onSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}