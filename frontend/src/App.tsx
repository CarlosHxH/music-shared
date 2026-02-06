import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import './App.css';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ArtistDetailPage = lazy(() => import('./pages/ArtistDetailPage'));
const AlbunsPage = lazy(() => import('./pages/AlbunsPage'));
const RegionaisPage = lazy(() => import('./pages/RegionaisPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-slate-400">Carregando...</div>
    </div>
  );
}

/**
 * Componente principal da aplicação
 * Define as rotas e layout geral
 */
function App() {
  return (
    <AuthProvider>
      <Toaster theme="dark" richColors position="top-right" closeButton />
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rota de Login - pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas protegidas com sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/artistas" replace />} />
              <Route path="/artistas" element={<HomePage />} />
              <Route path="/artistas/:id" element={<ArtistDetailPage />} />
              <Route path="/albuns" element={<AlbunsPage />} />
              <Route path="/regionais" element={<RegionaisPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
