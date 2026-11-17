// src/components/cajero/SidebarCajero.jsx
import React from 'react';

export default function SidebarCajero({ activeTab, onTabChange }) {
  const menuItems = [
    { 
      id: 'mesas', 
      label: 'Pedidos de Mesa', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    { 
      id: 'domicilios', 
      label: 'Domicilios', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'historial', 
      label: 'Historial', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  return (
    <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col pt-8 shrink-0 h-full">
      <div className="px-4 mb-8">
        <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] mb-6 ml-4">Navegación</p>
        <div className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-all relative group overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-[#181818] text-[#FFC107]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                <div className={`transition-colors duration-300 ${
                  activeTab === item.id ? 'text-[#FFC107]' : 'text-zinc-700 group-hover:text-zinc-400'
                }`}>
                  {item.icon}
                </div>
                <span className="text-[14px] font-bold tracking-tight uppercase">{item.label}</span>
              </div>

              {/* Indicador Activo (Estilo Dashboard de la imagen) */}
              {activeTab === item.id && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[4px] h-8 bg-[#FFC107] rounded-l-full shadow-[0_0_15px_rgba(255,193,7,0.5)] animate-in slide-in-from-right duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Footer Sidebar */}
      <div className="mt-auto p-8 border-t border-white/5">
        <div className="flex items-center gap-3 opacity-30 group cursor-default">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v1.2.0 Stable</p>
        </div>
      </div>
    </aside>
  );
}
