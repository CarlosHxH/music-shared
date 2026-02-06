import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '@/services/AuthService';


/**
 * Componente que protege rotas exigindo autenticação
 * Redireciona para login se não autenticado
 */
export function ProtectedRoute() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar autenticação ao montar
    setAutenticado(authService.estaAutenticado());

    // Inscrever-se em mudanças de autenticação
    const subscription = authService.obterAutenticado().subscribe((auth) => {
      setAutenticado(auth);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Enquanto carrega, mostrar tela em branco
  if (autenticado === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  // Se não autenticado, redirecionar para login
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderizar componente
  return <Outlet />;
}
