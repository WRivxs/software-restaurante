// src/pages/Admin.jsx
import React, { useState } from 'react';
import DashboardContabilidad from '../components/admin/DashboardContabilidad';
import GestionMesas from '../components/admin/mesas/GestionMesas';
import GestionInventario from '../components/admin/categorias_productos/GestionInventario';
import GestionEgresos from '../components/admin/egresos/GestionEgresos';
import GestionIngresos from '../components/admin/ingresos/GestionIngresos';
import GestionUsuarios from '../components/admin/usuarios/GestionUsuarios';
import GestionTrabajadores from '../components/admin/trabajadores/GestionTrabajadores';
import Configuraciones from '../components/admin/configuracion/configuraciones';
import ConfirmacionLogout from '../components/ui/ConfirmacionLogout';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// SVG Icons profesionales
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  mesas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h18M3 10V7a1 1 0 011-1h16a1 1 0 011 1v3M3 10v4m18-4v4m-18 0h18m-18 0v3m18-3v3M6 17v3M18 17v3" />
    </svg>
  ),
  categorias: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  productos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  egresos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  usuarios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ingresos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  trabajadores: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard, component: DashboardContabilidad },
  { id: 'ingresos', label: 'Análisis Ingresos', icon: icons.ingresos, component: GestionIngresos },
  { id: 'mesas', label: 'Mesas', icon: icons.mesas, component: GestionMesas },
  { id: 'inventario', label: 'Categoría/Producto', icon: icons.productos, component: GestionInventario },
  { id: 'egresos', label: 'Gastos / Egresos', icon: icons.egresos, component: GestionEgresos },
  { id: 'usuarios', label: 'Usuarios', icon: icons.usuarios, component: GestionUsuarios },
  { id: 'trabajadores', label: 'Trabajadores', icon: icons.trabajadores, component: GestionTrabajadores },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111111] border-r border-white/[0.06] flex flex-col h-auto md:h-screen sticky top-0 overflow-hidden">
        
        {/* Logo */}
        <div className="h-[150px] bg-[#FFB100] border-b border-white/[0.06] flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Buen Provecho Logo" className="w-full h-full object-cover" />
        </div>

        {/* User Info */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-white font-bold text-sm tracking-tight">
            {user?.nombre || 'Administrador'}
          </p>
          <p className="text-[#FFB100]/70 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">
            {user?.rol || 'ADMIN'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left flex items-center gap-3.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white/[0.07] text-[#FFB100]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {/* Barra lateral dorada del item activo */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#FFB100] rounded-l-full" />
                )}
                <span className={`transition-colors ${isActive ? 'text-[#FFB100]' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-6 pt-4 border-t border-white/[0.06] space-y-0.5">
          <button
            onClick={() => setActiveTab('configuraciones')}
            className={`w-full text-left flex items-center gap-3.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all group ${
              activeTab === 'configuraciones'
                ? 'bg-white/[0.07] text-[#FFB100]'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span className={activeTab === 'configuraciones' ? 'text-[#FFB100]' : 'text-zinc-600 group-hover:text-zinc-400'}>
              {icons.settings}
            </span>
            Configuración
          </button>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full text-left flex items-center gap-3.5 px-4 py-2 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <span>{icons.logout}</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Modal de Confirmación de Salida */}
      <ConfirmacionLogout 
        open={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogout} 
      />

      {/* Área Principal */}
      <main className="flex-1 p-8 md:p-10 overflow-y-auto bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {activeTab === 'configuraciones' ? <Configuraciones /> : 
           MENU_ITEMS.find(m => m.id === activeTab)?.component &&
            React.createElement(MENU_ITEMS.find(m => m.id === activeTab).component)}
        </div>
      </main>
    </div>
  );
}
