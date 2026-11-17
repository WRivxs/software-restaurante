import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store global de la aplicación con persistencia.
 * Maneja: sesión del usuario actual, estado de carga y UI.
 */
export const useAppStore = create(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      // Pedido activo del Mesero (borrador antes de enviar)
      borradorPedido: {
        canal: null,      // 'MESA' | 'DOMICILIO'
        mesaId: null,
        mesaNumero: null,
        nombreCliente: '',
        tipoDomicilio: 'RECOGER', // 'RECOGER' | 'LLEVAR'
        direccion: '',
        telefono: '',
        notas: '',        // Nota general del pedido
        items: [],        // [{ productoId, nombre, precio, cantidad, notas }]
      },
      setBorradorCampo: (campo, valor) =>
        set((s) => ({ borradorPedido: { ...s.borradorPedido, [campo]: valor } })),
      agregarItem: (producto) =>
        set((s) => {
          const existing = s.borradorPedido.items.find((i) => i.productoId === producto.id);
          const items = existing
            ? s.borradorPedido.items.map((i) =>
                i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
              )
            : [
                ...s.borradorPedido.items,
                {
                  productoId: producto.id,
                  nombre: producto.nombre,
                  precio: producto.precio_venta,
                  cantidad: 1,
                  notas: '',
                },
              ];
          return { borradorPedido: { ...s.borradorPedido, items } };
        }),
      quitarItem: (productoId) =>
        set((s) => {
          const items = s.borradorPedido.items
            .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
            .filter((i) => i.cantidad > 0);
          return { borradorPedido: { ...s.borradorPedido, items } };
        }),
      actualizarNotas: (productoId, notas) =>
        set((s) => ({
          borradorPedido: {
            ...s.borradorPedido,
            items: s.borradorPedido.items.map((i) =>
              i.productoId === productoId ? { ...i, notas } : i
            ),
          },
        })),
      limpiarBorrador: () =>
        set({
          borradorPedido: {
            canal: null,
            mesaId: null,
            mesaNumero: null,
            nombreCliente: '',
            tipoDomicilio: 'RECOGER',
            direccion: '',
            telefono: '',
            notas: '',
            items: [],
          },
        }),
    }),
    {
      name: 'buen-provecho-storage', // Nombre del localStorage
       partialize: (state) => ({ 
         user: state.user,
         borradorPedido: state.borradorPedido 
       }), 
    }
  )
);
