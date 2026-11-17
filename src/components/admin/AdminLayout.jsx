// src/components/admin/AdminLayout.jsx
// Panel de administración — Sidebar + áreas de gestión
import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import GestionMesas from './mesas/GestionMesas';
import GestionCategorias from './categorias_productos/GestionCategorias';
import GestionProductos from './categorias_productos/GestionProductos';
import GestionEgresos from './GestionEgresos';
import GestionUsuarios from './usuarios/GestionUsuarios';
import Contabilidad from './Contabilidad';

const NAV = [
  { path: 'mesas',       label: 'Mesas',        icon: '🪑' },
  { path: 'categorias',  label: 'Categorías',    icon: '📂' },
  { path: 'productos',   label: 'Productos',     icon: '🍔' },
  { path: 'egresos',     label: 'Egresos',       icon: '💸' },
  { path: 'usuarios',    label: 'Usuarios',      icon: '👥' },
  { path: 'contabilidad',label: 'Contabilidad',  icon: '📊' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64 bg-bg-surface border-r border-bg-border
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-bg-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center text-xl">🍔</div>
            <div>
              <p className="text-white font-black text-sm leading-none">Restaurante</p>
              <p className="text-zinc-500 text-xs mt-0.5">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-brand-yellow text-black shadow-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-bg-elevated'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer usuario */}
        <div className="p-4 border-t border-bg-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
              <span className="text-black text-xs font-black">
                {user?.nombre?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.nombre}</p>
              <p className="text-zinc-500 text-[10px]">Administrador</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Topbar móvil */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-surface border-b border-bg-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-black text-sm">Admin</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route index element={<Contabilidad />} />
            <Route path="contabilidad" element={<Contabilidad />} />
            <Route path="mesas" element={<GestionMesas />} />
            <Route path="categorias" element={<GestionCategorias />} />
            <Route path="productos" element={<GestionProductos />} />
            <Route path="egresos" element={<GestionEgresos />} />
            <Route path="usuarios" element={<GestionUsuarios />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
