import { useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Music2, Disc3, Globe, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { webSocketService } from '@/services/WebSocketService';
import { toast } from 'sonner';

const navItems = [
  { to: '/artistas', label: 'Artistas', icon: Music2 },
  { to: '/albuns', label: 'Álbuns', icon: Disc3 },
  { to: '/regionais', label: 'Regionais', icon: Globe },
  { to: '/perfil', label: 'Perfil', icon: User },
];

/**
 * Layout principal com sidebar shadcn e área de conteúdo
 * Desktop: sidebar fixa. Mobile: Sheet (drawer) com SidebarTrigger
 */
export function AppLayout() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      webSocketService.conectar();
      const sub = webSocketService.obterNotificacoes().subscribe((notif) => {
        if (notif?.message) {
          toast.info(notif.message, { duration: 5000 });
        }
      });
      return () => {
        sub.unsubscribe();
        webSocketService.desconectar();
      };
    }
  }, [user]);

  return (
    <SidebarProvider>
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="icon"
        className="border-r border-slate-800 bg-slate-900"
      >
        <SidebarHeader className="border-b border-slate-800 h-14 flex items-center justify-center gap-2 px-2">
          <Music2 className="size-6 shrink-0 text-white" />
          <span className="text-white font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            Music Albums
          </span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <NavSideLink to={to} label={label} icon={<Icon className="size-4" />}>
                      {label}
                    </NavSideLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-800 p-4">
          {user && (
            <Link
              to="/perfil"
              className="block px-2 py-2 text-slate-400 text-sm truncate group-data-[collapsible=icon]:hidden hover:text-white transition-colors"
            >
              {user.username}
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-white group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center"
            onClick={() => logout()}
          >
            <LogOut className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="h-14 border-b border-slate-800 flex items-center gap-4 px-4 lg:px-6 sticky top-0 bg-slate-950 z-10">
          <SidebarTrigger className="text-slate-400 hover:bg-slate-800 hover:text-white" />
          <h1 className="text-lg font-semibold text-white truncate">Music Albums</h1>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/** NavLink estilizado como SidebarMenuButton, fecha sidebar no mobile, tooltip no modo icon */
function NavSideLink({
  to,
  label,
  icon,
  children,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  const isActive =
    location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
      <NavLink
        to={to}
        onClick={() => isMobile && setOpenMobile(false)}
        className="flex w-full items-center gap-2"
      >
        {icon}
        <span>{children}</span>
      </NavLink>
    </SidebarMenuButton>
  );
}
