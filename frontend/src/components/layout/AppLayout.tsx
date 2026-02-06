import { useEffect, useState } from 'react';
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
import { Music2, Disc3, Globe, User, LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { webSocketService } from '@/services/WebSocketService';
import { artistFacadeService } from '@/services/ArtistFacadeService';
import { albumFacadeService } from '@/services/AlbumFacadeService';
import { toast } from 'sonner';
import api from '@/utils/api';

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
  const [testandoWs, setTestandoWs] = useState(false);

  useEffect(() => {
    if (user) {
      webSocketService.conectar();
      const sub = webSocketService.obterNotificacoes().subscribe((notif) => {
        if (!notif) return;
        if (notif.message) {
          toast.info(notif.message, { duration: 5000 });
        }
        if (notif.type?.startsWith('ARTISTA_')) {
          artistFacadeService.invalidarCache();
        }
        if (notif.type?.startsWith('ALBUM_')) {
          albumFacadeService.invalidarCache();
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
        className="border-r border-slate-700"
      >
        <SidebarHeader className="border-b border-slate-700 h-14 md:h-auto flex items-center justify-center gap-2 px-4 bg-slate-900/50">
        <div className="flex items-center justify-center gap-2">
          <Music2 className="size-6 shrink-0 text-emerald-400" />
          <span className="text-slate-100 font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            Music Albums
          </span>
        </div>
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

        <SidebarFooter className="border-t border-slate-700 p-4 bg-slate-950/40 space-y-1">
          {user && (
            <>
              <Link
                to="/perfil"
                className="block px-2 py-2 text-slate-400 text-sm truncate group-data-[collapsible=icon]:hidden hover:text-emerald-400 transition-colors rounded-md"
              >
                {user.username}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-700/50 hover:text-emerald-400/90 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center rounded-md"
                onClick={async () => {
                  setTestandoWs(true);
                  try {
                    await api.post('/test/websocket');
                    const conectado = webSocketService.estaConectado();
                    toast.success(
                      conectado
                        ? 'Teste enviado! O toast de notificação deve aparecer em instantes.'
                        : 'Backend enviou a notificação, mas o WebSocket não está conectado. Verifique o console (F12) para [WebSocket].'
                    );
                  } catch {
                    toast.error('Falha ao testar WebSocket. Verifique se o backend está rodando.');
                  } finally {
                    setTestandoWs(false);
                  }
                }}
                disabled={testandoWs}
              >
                <Zap className="size-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {testandoWs ? 'Enviando...' : 'Testar WebSocket'}
                </span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-700/50 hover:text-slate-100 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center rounded-md"
            onClick={() => logout()}
          >
            <LogOut className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="h-14 shrink-0 border-b border-slate-700 flex items-center gap-4 px-3 sm:px-4 lg:px-6 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
          <SidebarTrigger className="text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-md size-9" />
        </header>

        <main className="flex-1 min-h-0 overflow-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
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
