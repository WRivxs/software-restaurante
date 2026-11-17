// src/App.jsx — Router principal con protección de rutas por rol
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';

// Páginas
import Login from './pages/Login';
import Admin from './pages/Admin';
import Cajero from './pages/Cajero';
import Mesero from './pages/Mesero';

import { Suspense } from 'react';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos
      retry: 1,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  // Si ya tenemos usuario y es ADMIN, acceso TOTAL inmediato
  if (user?.rol === 'ADMIN') return children;
  
  // Si no hay usuario y ya terminó de cargar, al login
  if (!user && !loading) return <Navigate to="/login" replace />;
  
  // Si está cargando y no tenemos usuario aún, mostramos pantalla de carga
  if (loading && !user) return <LoadingScreen />;
  
  if (user && allowedRoles && !allowedRoles.includes(user.rol)) {
    const roleRedirect = { CAJERO: '/cajero', MESERO: '/mesero', ADMIN: '/admin' };
    return <Navigate to={roleRedirect[user.rol] || '/login'} replace />;
  }
  return children;
}

/** Redirige desde / según el rol del usuario */
function RoleRedirect() {
  const { user, loading } = useAuth();
  
  if (loading && !user) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (user) {
    const map = { ADMIN: '/admin', CAJERO: '/cajero', MESERO: '/mesero' };
    const destination = map[user.rol] || '/admin';
    console.log('🚀 RoleRedirect: Redirigiendo a', destination);
    return <Navigate to={destination} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Pública */}
              <Route path="/login" element={<Login />} />

              {/* Protegidas */}
              <Route 
                path="/admin/*" 
                element={<ProtectedRoute allowedRoles={['ADMIN']}><Admin /></ProtectedRoute>} 
              />
              <Route 
                path="/cajero/*" 
                element={<ProtectedRoute allowedRoles={['CAJERO', 'ADMIN']}><Cajero /></ProtectedRoute>} 
              />
              <Route 
                path="/mesero/*" 
                element={<Mesero />} 
              />

              {/* Raíz → redirige según rol */}
              <Route path="/" element={<RoleRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </ToastProvider>
    </QueryClientProvider>
  );
}
