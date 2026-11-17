# Plan de Implementación v2.3
# Software Administrativo para Restaurante Fast-Food — Colombia 🇨🇴

> **Stack:** React + Vite + TailwindCSS v3 · shadcn/ui · Supabase (PostgreSQL + Realtime + Auth) · React Query
> **Moneda:** Pesos Colombianos (COP)
> **Diseño:** Fondo negro puro `#000000` · Acentos amarillo `#F5B800` y naranja `#FF6B00`
> **Regla de estilo:** 100% Tailwind utility classes — **CERO CSS plano, cero archivos .css propios**

---

## ÍNDICE

1. Decisiones de Arquitectura y Stack
2. Sistema de Roles y Pantallas
3. Esquema de Base de Datos (Supabase / PostgreSQL)
4. Sincronización en Tiempo Real (Supabase Realtime)
5. Módulos por Pantalla (Mesero · Cajero · Admin)
6. Módulo de Contabilidad
7. Generación de Factura
8. Sistema de Diseño (Tokens Visuales)
9. Estructura de Carpetas del Proyecto
10. Flujos de Prueba y Validación

---

## 1. Decisiones de Arquitectura y Stack

```
Frontend   →  React 18 + Vite
Estilos    →  TailwindCSS v3 (EXCLUSIVO — sin CSS plano, sin archivos .css propios)
UI Library →  shadcn/ui  (componentes profesionales basados 100% en Tailwind + Radix UI)
BDD/Auth   →  Supabase (PostgreSQL 15 + Auth + Realtime + Storage)
Estado     →  React Query (TanStack) + Zustand (estado local UI)
Factura    →  jsPDF + html2canvas para generación PDF en cliente
Iconos     →  Lucide React (incluido en shadcn/ui)
Fechas     →  date-fns con locale es-CO
Gráficas   →  Recharts (compatible con shadcn/ui)
Deploy     →  Vercel (frontend gratuito)
```

### ¿Qué es shadcn/ui y por qué usarlo?

shadcn/ui **no es una librería de componentes instalada como dependencia** — es una colección de componentes que se copian directamente a tu proyecto en `src/components/ui/`. Esto significa:

- Cada componente es **tuyo**, puedes modificarlo completamente con clases Tailwind
- Usa **Radix UI** por debajo para accesibilidad y comportamiento (modales, dropdowns, tooltips)
- Diseño profesional de nivel enterprise listo para personalizar con los colores del restaurante
- Sin conflictos con Tailwind, porque **son la misma tecnología**

### Componentes shadcn/ui que se usarán

| Componente | Dónde se usa |
|---|---|
| `Button` | Todos los botones del sistema |
| `Card` | Tarjetas de productos, pedidos, KPIs |
| `Dialog` / `Sheet` | Modales y paneles laterales |
| `Input` / `Label` | Todos los formularios |
| `Select` / `Combobox` | Selección de categoría, mesa, rol |
| `Badge` | Estados de pedidos (PENDIENTE, PAGADO...) |
| `Table` | Historial de pedidos, egresos, productos |
| `Tabs` | Navegación en pantalla cajero y admin |
| `Separator` | Divisores visuales en factura y paneles |
| `Toaster` / `Toast` | Notificaciones de nuevos pedidos, éxito/error |
| `Avatar` | Identificación de usuarios en la barra superior |
| `DropdownMenu` | Menú de opciones en registros de tablas |
| `AlertDialog` | Confirmación de eliminación o cancelación |

### Regla absoluta de estilos

```
✅ CORRECTO:  className="bg-black text-white rounded-xl p-4 border border-zinc-800"
✅ CORRECTO:  className="bg-[#F5B800] text-black font-bold hover:bg-[#FFD447]"
❌ PROHIBIDO: style={{ backgroundColor: '#F5B800' }}   ← solo si Tailwind no alcanza
❌ PROHIBIDO: Crear archivos .css con clases propias
❌ PROHIBIDO: Usar @apply en ningún archivo salvo tailwind.config.js
```

### ¿Por qué este stack?

| Necesidad | Solución elegida | Razón |
|---|---|---|
| Mesero y cajero en dispositivos distintos | Supabase Realtime | WebSockets gestionados sin servidor propio |
| Múltiples roles con acceso diferente | Supabase Auth + RLS (Row Level Security) | Seguridad a nivel de base de datos |
| Escalabilidad futura | PostgreSQL en Supabase | Migración sin tocar código |
| Factura imprimible | jsPDF + html2canvas | Generación en el cliente, sin backend extra |
| Gráficas de contabilidad | Recharts | Compatible nativo con Tailwind y shadcn/ui |
| Diseño profesional | shadcn/ui + Tailwind | Componentes accesibles y 100% personalizables |

---

## 2. Sistema de Roles y Pantallas

Supabase Auth maneja la autenticación. Cada usuario tiene un campo `rol` en la tabla `usuarios`.

```
ROL ADMIN    →  Acceso completo: contabilidad, productos, mesas, categorías, usuarios
ROL CAJERO   →  POS, cobros, domicilios, historial de pedidos del día
ROL MESERO   →  Registrar y enviar comandas desde tablet/celular
```

### Redirección automática al iniciar sesión

```
Login  →  detecta rol  →  /admin    (Admin - Email/Pass)
                       →  /cajero   (Cajero - Email/Pass)
                       →  /mesero   (Mesero - PIN rápido)

### Autenticación del Mesero (PIN)

Para agilizar el trabajo, los meseros no usarán email/password. El **Admin** los crea en el sistema con su **Nombre** y un **PIN de 4 dígitos**.
1. En la tablet del mesero habrá una pantalla con los nombres de los meseros activos.
2. El mesero selecciona su nombre.
3. Ingresa su PIN de 4 dígitos en un teclado numérico (PINPad).
4. El sistema valida el PIN y le da acceso a su área de comandas.
```

---

## 3. Esquema de Base de Datos (Supabase / PostgreSQL)

### 3.1 Usuarios y Roles

```sql
-- Tabla de usuarios (extiende auth.users de Supabase)
create table public.usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text        not null,
  rol        text        not null check (rol in ('ADMIN', 'CAJERO', 'MESERO')),
  pin        text,                   -- Solo para MESEROS (PIN de 4-6 dígitos)
  activo     boolean     not null default true,
  creado_en  timestamptz not null default now()
);
```

### 3.2 Mesas (Creadas y gestionadas por el Admin)

```sql
create table public.mesas (
  id         serial      primary key,
  numero     int         not null unique,  -- Ej: 1, 2, 3, 4...
  nombre     text,                         -- Ej: "Mesa VIP", "Terraza 1" (opcional)
  capacidad  int         not null default 4,
  activa     boolean     not null default true,
  creado_en  timestamptz not null default now()
);
-- El Admin puede CREAR, EDITAR y ELIMINAR mesas.
-- El Mesero solo puede LEER mesas activas para asignar pedidos.
```

### 3.3 Categorías (Creadas y gestionadas por el Admin)

```sql
create table public.categorias (
  id        serial  primary key,
  nombre    text    not null unique,  -- Ej: "Arepas", "Hamburguesas", "Bebidas"
  orden     int     not null default 0,  -- Para ordenar en el menú visual
  activa    boolean not null default true
);
-- El Admin puede CREAR, EDITAR y ELIMINAR categorías.
```

### 3.4 Productos del Menú (Creados y gestionados por el Admin)

```sql
create table public.productos (
  id           serial   primary key,
  nombre       text     not null,              -- Ej: "Arepa de Carne"
  descripcion  text,
  precio_venta numeric  not null,              -- Ej: 11000.00 (COP)
  categoria_id int      references public.categorias(id) on delete set null,
  activo       boolean  not null default true,
  creado_en    timestamptz not null default now()
);
-- El Admin puede CREAR, EDITAR precio/nombre/categoría y ELIMINAR productos.
-- Los precios son editables en cualquier momento desde el panel Admin.
```

### 3.5 Inversiones / Egresos (Contabilidad del Admin)

```sql
-- REEMPLAZA el módulo de insumos complejo.
-- El Admin registra cuánto dinero gastó y en qué lo gastó.
create table public.egresos (
  id          serial      primary key,
  descripcion text        not null,  -- Ej: "Compra de carne - Proveedor Frigorífico X"
  categoria_egreso text   not null   check (categoria_egreso in (
    'INSUMOS',       -- Materias primas, alimentos
    'SERVICIOS',     -- Agua, luz, gas
    'NOMINA',        -- Pago a empleados
    'EQUIPOS',       -- Compra de equipos
    'ARRIENDO',      -- Arrendamiento del local
    'OTRO'           -- Cualquier otro gasto
  )),
  monto       numeric     not null,  -- Cuánto se gastó en COP
  fecha       date        not null default current_date,
  nota        text,                  -- Detalle adicional
  registrado_por uuid references public.usuarios(id),
  creado_en   timestamptz not null default now()
);
```

### 3.6 Pedidos

```sql
create table public.pedidos (
  id                serial      primary key,
  codigo            text        not null unique,  -- Ej: "M-001", "D-001"
  canal             text        not null check (canal in ('MESA', 'DOMICILIO')),
  estado            text        not null check (estado in (
    'PENDIENTE',   -- Enviado por el mesero, esperando en caja
    'EN_PROCESO',  -- El cajero lo abrió / está preparando
    'PAGADO',      -- Cobrado exitosamente
    'ENTREGADO',   -- Entregado al cliente
    'CANCELADO'    -- Cancelado por cualquier razón
  )),
  metodo_pago       text        check (metodo_pago in ('EFECTIVO', 'TRANSFERENCIA', 'PENDIENTE')),

  -- Financiero
  total             numeric     not null default 0,
  costo_domicilio   numeric     not null default 0, -- Precio del envío (solo si canal = 'DOMICILIO')
  pago_cliente      numeric,    -- Cuánto entregó en efectivo
  cambio            numeric,    -- Vuelto a entregar

  -- Mesa (si canal = 'MESA')
  mesa_id           int         references public.mesas(id) on delete set null,
  nombre_cliente    text,       -- Nombre del cliente en la mesa

  -- Domicilio (si canal = 'DOMICILIO')
  tipo_domicilio    text        check (tipo_domicilio in ('LLEVAR', 'RECOGER')),
  nombre_cliente_dom text,
  direccion_cliente text,
  telefono_cliente  text,

  -- Relaciones
  cajero_id         uuid        references public.usuarios(id) on delete set null,
  mesero_id         uuid        references public.usuarios(id) on delete set null,

  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);
```

### 3.7 Detalle del Pedido

```sql
create table public.detalle_pedido (
  id              serial  primary key,
  pedido_id       int     not null references public.pedidos(id) on delete cascade,
  producto_id     int     not null references public.productos(id) on delete restrict,
  cantidad        int     not null check (cantidad > 0),
  precio_unitario numeric not null,  -- Copia histórica del precio al momento de vender
  subtotal        numeric not null,  -- cantidad × precio_unitario
  notes           text    -- Ej: "Sin cebolla", "Muy bien cocido" (CORRIGE punto 4 anterior)
);
```

### 3.8 Cierres de Caja (Registro histórico)

```sql
create table public.cierres_caja (
  id                  uuid        primary key default gen_random_uuid(),
  cajero_id           uuid        references public.usuarios(id),
  fecha_apertura      timestamptz not null default now(),
  fecha_cierre        timestamptz,
  ventas_efectivo     numeric     not null default 0, -- Calculado por el sistema
  ventas_transferencia numeric    not null default 0, -- Calculado por el sistema
  total_esperado      numeric     not null default 0, -- efectivo + transferencia
  monto_real_contado  numeric,                        -- Ingresado por el cajero
  diferencia          numeric,                        -- real - esperado
  estado              text        not null default 'ABIERTA' check (estado in ('ABIERTA', 'CERRADA'))
);
```

### 3.9 Resumen de Relaciones

```
categorias ──< productos
mesas      ──< pedidos >── detalle_pedido >── productos
usuarios   ──< pedidos (cajero + mesero)
egresos    ── (independiente, registrado por admin)
```

---

## 4. Sincronización en Tiempo Real (Supabase Realtime)

Este es el núcleo que conecta mesero ↔ cajero sin recargar la página.

```
MESERO envía comanda
   │
   ▼
INSERT en tabla pedidos  (estado = 'PENDIENTE')
   │
   ▼
Supabase Realtime emite evento
   │
   ▼
CAJERO recibe notificación automática en su pantalla
   │
   ▼
Suena alerta sonora + aparece tarjeta del nuevo pedido
```

### Implementación en React (ejemplo)

```javascript
// Hook personalizado: useRealtimePedidos.js
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimePedidos() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('pedidos-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          // Invalida el cache → React Query recarga la lista automáticamente
          queryClient.invalidateQueries(['pedidos', 'PENDIENTE'])
          // Reproducir sonido de alerta en caja
          new Audio('/sounds/nuevo-pedido.mp3').play()
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        () => queryClient.invalidateQueries(['pedidos'])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [queryClient])
}
```

---

## 5. Módulos por Pantalla

### 5.1 Pantalla del MESERO (`/mesero`)

**Diseño:** Optimizado para tablet y celular · 100% Tailwind + shadcn/ui · Fondo `bg-black`

#### Módulos:
| Módulo | Descripción |
|---|---|
| Selección de canal | Botones shadcn `Button` grande: `MESA` o `DOMICILIO` al iniciar |
| **Nombre del cliente** ⭐ | Campo `Input` de shadcn/ui — **OBLIGATORIO siempre**, tanto para mesa como domicilio. Se guarda en el pedido y se muestra en caja para identificar al cliente |
| Cuadrícula de mesas | Cards shadcn/ui con las mesas activas. Verde = libre, Rojo = ocupada |
| Menú visual por categorías | `Tabs` shadcn/ui por categoría, `Card` de productos con botones `+` / `-` |
| Comanda activa (bottom sheet) | `Sheet` de shadcn/ui con lista de ítems, campo `Input` de notas por ítem |
| Botón "Enviar a Caja" | `Button` primario amarillo. Crea el pedido en Supabase con estado `PENDIENTE` |
| **Apartado "Mis Pedidos"** ⭐| Panel donde el mesero ve sus pedidos activos, detalles y notas para informar a la cocina de forma verbal |

#### Flujo del mesero:
```
1. Elige canal: MESA o DOMICILIO
2. ★ Escribe el nombre del cliente (campo obligatorio — no puede enviar sin esto)
3. Si MESA → selecciona la mesa del mapa de cuadrícula
4. Agrega productos al pedido con notas si es necesario ("sin cebolla")
5. Presiona "Enviar Comanda a Caja"
6. Toast de confirmación ("¡Comanda enviada! Mesa 3 - Juan") → pantalla se limpia
```

#### Cómo se ve el nombre en caja:
```
┌─────────────────────────────────────────┐
│  🟡 PENDIENTE  ·  Mesa 3                │
│  👤 Cliente: Juan Pérez                 │  ← nombre guardado por el mesero
│  🕐 Hace 2 minutos                      │
│  Arepa de Carne × 1   Sin cebolla       │
│  Jugo Natural × 2                       │
│  Total: $32,000 COP                     │
└─────────────────────────────────────────┘
```

---

### 5.2 Pantalla del CAJERO (`/cajero`)

**Diseño:** Vista dividida en dos columnas en desktop · 100% Tailwind + shadcn/ui · Fondo `bg-black`

La pantalla del cajero tiene **dos tabs principales** en la parte superior:

```
[ 🧾 Pedidos de Mesa ]   [ 🛵 Domicilios ]
```

---

#### TAB 1 — Pedidos de Mesa

| Módulo | Descripción |
|---|---|
| Cola de pedidos pendientes | Lista en tiempo real de pedidos con estado `PENDIENTE` y `EN_PROCESO` con nombre del cliente visible |
| Detalle del pedido | Al hacer clic, muestra ítems con sus notas, nombre del cliente y mesa |
| Módulo de cobro en efectivo | Billetes rápidos COP: `$10k`, `$20k`, `$50k`, `$100k`. Calcula cambio al instante |
| Módulo de transferencia | Registra pago por transferencia bancaria |
| Cambio de estado | Botones: `EN PROCESO` → `PAGADO` → `ENTREGADO` |
| Generador de factura | Botón "Ver / Imprimir Factura" abre el PDF en modal |
| Historial del día | Pedidos pagados y cancelados del día en curso |

#### Flujo de cobro en efectivo:
```
Cajero abre pedido de $11,000
   │
   ▼
Presiona billete rápido $50,000
   │
   ▼
Sistema muestra: "Cambio a entregar: $39,000 COP"  ← calculado al instante
   │
   ▼
Cajero confirma → estado cambia a PAGADO → se genera la factura
```

---

#### TAB 2 — Domicilios (registro completo desde caja)

El cajero puede registrar **un domicilio completo directamente desde esta pantalla**, sin necesitar al mesero. El flujo tiene 3 pasos en un solo panel o `Sheet` de shadcn/ui:

##### Paso 1 — Datos del cliente
```
┌─────────────────────────────────────────────┐
│  NUEVO DOMICILIO                            │
├─────────────────────────────────────────────┤
│  Nombre del cliente *        [____________] │
│  Teléfono          *        [____________] │
│                                             │
│  Tipo de entrega:                           │
│  ◉ RECOGER en local   ○ LLEVAR a domicilio  │
│                                             │
│  Dirección  (solo si LLEVAR)               │
│  [__________________________________________]│
│                              [Continuar →]  │
└─────────────────────────────────────────────┘
```
- Si elige **RECOGER** → el campo dirección se oculta automáticamente
- Si elige **LLEVAR** → el campo dirección se hace obligatorio
- Nombre y teléfono son obligatorios siempre

##### Paso 2 — Agregar productos al pedido
```
┌─────────────────────────────────────────────┐
│  PRODUCTOS  — Domicilio: Juan Pérez         │
├──────────────────────┬──────────────────────┤
│  MENÚ                │  RESUMEN PEDIDO      │
│  [Arepas][Bebidas]   │  ─────────────────── │
│  [Hamburguesas][+]   │  Arepa de Carne  ×1  │
│                      │  Sin cebolla         │
│  🍔 Arepa de Carne   │  $11,000             │
│     $11,000  [+ Añadir]│                    │
│                      │  Jugo Natural   ×2   │
│  🥤 Jugo Natural     │  $10,000             │
│     $5,000   [+ Añadir]│                    │
│                      │  ─────────────────── │
│                      │  TOTAL: $21,000      │
│                      │  [← Atrás] [Cobrar→] │
└──────────────────────┴──────────────────────┘
```
- El cajero selecciona productos por categoría igual que el menú del mesero
- Puede agregar notas por ítem ("extra queso", "sin sal")
- Ve el resumen del pedido en tiempo real con el total actualizado
- Botón `+ Añadir` agrega el ítem con un campo de notas opcional inline

##### Paso 3 — Costo de Domicilio y Cobro
```
┌─────────────────────────────────────────────┐
│  COBRO — Juan Pérez · LLEVAR                │
│  Tel: 300-123-4567                          │
│  Dir: Calle 45 #12-34                       │
├─────────────────────────────────────────────┤
│  Subtotal:          $21,000 COP             │
│  Costo Domicilio:  [$ 5,000] (editable)     │
│  TOTAL A COBRAR:    $26,000 COP             │
│                                             │
│  Método de pago:                            │
│  ◉ Efectivo    ○ Transferencia              │
│                                             │
│  Billetes rápidos:                          │
│  [$10k]  [$20k]  [$50k]  [$100k]           │
│                                             │
│  Recibido: $50,000  →  Cambio: $24,000      │
│                                             │
│  [Confirmar y Generar Factura ✓]            │
└─────────────────────────────────────────────┘
```

##### Vista de domicilios activos en el tab
Una vez creados, los domicilios aparecen en una lista de tarjetas con su estado:

```
┌──────────────────────────────────────────┐
│  🛵 Juan Pérez          LLEVAR  🟡PENDIENTE│
│  Tel: 300-123-4567                       │
│  Calle 45 #12-34                         │
│  Arepa ×1 + Jugo ×2  →  $21,000         │
│  [Ver detalle]  [Marcar ENTREGADO]       │
├──────────────────────────────────────────┤
│  🏪 María López         RECOGER  🟢PAGADO │
│  Tel: 310-987-6543                       │
│  Hamburguesa ×2  →  $26,000              │
│  [Ver Factura]                           │
└──────────────────────────────────────────┘
```

##### Lógica condicional del campo dirección

```javascript
// En el componente FormDomicilio.jsx — 100% Tailwind
<div className="space-y-4">
  {/* Radio RECOGER / LLEVAR */}
  <RadioGroup value={tipo} onValueChange={setTipo}>
    <RadioGroupItem value="RECOGER" label="Recoger en local" />
    <RadioGroupItem value="LLEVAR"  label="Llevar a domicilio" />
  </RadioGroup>

  {/* Campo dirección: solo visible si LLEVAR */}
  {tipo === 'LLEVAR' && (
    <div className="space-y-1">
      <Label className="text-zinc-400 text-sm">Dirección *</Label>
      <Input
        className="bg-bg-elevated border-bg-border focus:border-brand-yellow"
        placeholder="Calle, barrio, referencia..."
        required
      />
    </div>
  )}
</div>
```

---

### 5.3 Pantalla del ADMIN (`/admin`)

**Diseño:** Panel lateral de navegación · Secciones independientes

#### Módulos del Admin:

##### A. Gestión de Mesas
- **Crear** mesa: número, nombre opcional, capacidad
- **Editar** cualquier mesa existente
- **Eliminar** mesa (con advertencia si tiene pedidos activos)
- Vista en cuadrícula mostrando estado actual de cada mesa

##### B. Gestión de Categorías
- **Crear** categoría: nombre + orden de aparición en menú
- **Editar** nombre y orden
- **Eliminar** categoría (solo si no tiene productos activos)

##### C. Gestión de Productos
- **Crear** producto: nombre, descripción, precio de venta, categoría
- **Editar** precio, nombre, descripción o categoría en cualquier momento
- **Desactivar / Eliminar** producto
- Buscador + filtro por categoría

##### D. Gestión de Egresos (Inversión)
- **Registrar egreso**: descripción, categoría (`INSUMOS`, `NOMINA`, `SERVICIOS`, etc.), monto COP, fecha, nota
- **Editar / Eliminar** egresos registrados
- Listado de egresos con filtro por fecha y categoría
- Total de egresos del período seleccionado

##### E. Gestión de Usuarios
- **Crear** usuario: nombre, email, rol (Mesero/Cajero/Admin)
- **Asignar PIN** (solo meseros): El Admin define un código numérico para el ingreso rápido
- **Activar / Desactivar** usuarios
- El Admin no puede eliminar su propio usuario

---

## 6. Módulo de Contabilidad (Admin)

Este es el dashboard financiero completo del negocio.

### 6.1 KPIs Principales (tarjetas en la parte superior)

| Indicador | Cálculo | Color |
|---|---|---|
| **Total Ingresos** | `SUM(pedidos.total WHERE estado = 'PAGADO')` | Verde `#22C55E` |
| **Total Egresos** | `SUM(egresos.monto)` | Rojo `#EF4444` |
| **Utilidad Neta** | `Ingresos - Egresos` | Amarillo `#F5B800` si positivo |
| **Punto de Equilibrio** | ¿Ya se recuperó la inversión? (`Ingresos >= Egresos`) | Indicador visual |
| **Pedidos del día** | Conteo de pedidos pagados hoy | Naranja `#FF6B00` |
| **Ticket Promedio** | `Total Ingresos / Cant. Pedidos` | Blanco |

### 6.2 Gráficas (Recharts)

| Gráfica | Tipo | Descripción |
|---|---|---|
| Ingresos vs Egresos | Barras agrupadas | Comparación mensual |
| Ventas por Canal | Torta / Dona | Mesa vs Domicilio |
| Productos más vendidos | Barras horizontales | Top 5 o Top 10 |
| Evolución de ingresos | Línea | Últimos 30 días |
| Egresos por categoría | Torta | Distribución de gastos |

### 6.3 Filtros del Dashboard

- Por rango de fechas (hoy / esta semana / este mes / personalizado)
- Por canal (Mesa / Domicilio / Todos)
- Por método de pago (Efectivo / Transferencia / Todos)

### 6.4 Cierre Diario (para el Cajero)

Al finalizar el turno, el cajero realiza el cierre de caja. El sistema calcula automáticamente los totales para que el cajero los verifique:

- **Total Efectivo Esperado:** Suma de pedidos `PAGADO` en efectivo.
- **Total Transferencia Esperado:** Suma de pedidos `PAGADO` por transferencia.
- **Diferencia:** El cajero ingresa el dinero físico contado; el sistema indica si hay descuadre.
- **Historial:** El cierre se guarda en la tabla `cierres_caja` para auditoría del Admin.
- **Detalle:** Lista de pedidos del día agrupados por método de pago.

---

## 7. Generación de Factura (PDF)

### Estructura de la Factura

```
┌────────────────────────────────────────┐
│  🍔  RESTAURANTE [NOMBRE]              │
│  NIT: XXX-X · Tel: XXXXXXXX            │
│  Dirección · Ciudad, Colombia          │
├────────────────────────────────────────┤
│  FACTURA DE VENTA                      │
│  No: M-001          Fecha: DD/MM/YYYY  │
│  Hora: HH:MM        Mesa: 3            │
│  Cliente: [Nombre del cliente]         │
│  Atendido por: [Nombre cajero]         │
├────────────────────────────────────────┤
│  CANT  PRODUCTO           SUBTOTAL     │
│  1     Arepa de Carne    $11,000       │
│        (Sin cebolla)                   │
│  2     Jugo Natural      $10,000       │
├────────────────────────────────────────┤
│  TOTAL:                  $21,000 COP   │
│  Forma de pago: Efectivo               │
│  Pagó: $50,000   Cambio: $29,000       │
├────────────────────────────────────────┤
│  ¡Gracias por su visita!               │
│  Conserve su factura para reclamaciones│
└────────────────────────────────────────┘
```

### Comportamiento

- Se genera en el navegador del cajero (sin servidor extra)
- Opción de **imprimir** directamente desde el navegador
- Opción de **descargar como PDF**
- Vista previa en modal antes de imprimir
- La factura queda ligada al pedido y se puede reimprimir desde el historial

---

## 8. Sistema de Diseño (100% Tailwind)

### Configuración de tailwind.config.js

Todo el sistema de colores se define aquí una sola vez. Luego se usa con clases como `bg-brand-yellow`, `text-brand-orange`, etc.

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Fondos
        'bg-primary':  '#000000',   // bg-bg-primary   → fondo principal negro puro
        'bg-surface':  '#0D0D0D',   // bg-bg-surface   → tarjetas y paneles
        'bg-elevated': '#1A1A1A',   // bg-bg-elevated  → modales, dropdowns
        'bg-border':   '#2A2A2A',   // border-bg-border → bordes y separadores

        // Acentos de marca
        brand: {
          yellow:  '#F5B800',       // bg-brand-yellow  → botones primarios
          orange:  '#FF6B00',       // bg-brand-orange  → alertas, estados
          hover:   '#FFD447',       // hover:bg-brand-hover
        },

        // Estados
        state: {
          success: '#22C55E',       // text-state-success → pagado, disponible
          error:   '#EF4444',       // text-state-error   → cancelado, ocupado
          warning: '#FF6B00',       // text-state-warning → pendiente, en proceso
          info:    '#3B82F6',       // text-state-info    → información
        },
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

      borderRadius: {
        card: '12px',
      },

      boxShadow: {
        glow: '0 0 20px rgba(245, 184, 0, 0.15)',   // shadow-glow → efecto hover amarillo
      },
    },
  },
  plugins: [require('tailwindcss-animate')],  // requerido por shadcn/ui
}
```

### Configuración de shadcn/ui para tema oscuro

Después de instalar shadcn/ui (`npx shadcn-ui@latest init`), en el archivo `src/index.css` (el ÚNICO archivo CSS del proyecto, solo para las variables de Radix/shadcn):

```css
/* src/index.css — ÚNICO archivo CSS del proyecto */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 0%;          /* negro puro */
    --foreground: 0 0% 100%;        /* blanco */
    --card: 0 0% 5%;                /* #0D0D0D */
    --card-foreground: 0 0% 100%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 100%;
    --primary: 43 100% 48%;         /* #F5B800 amarillo */
    --primary-foreground: 0 0% 0%;
    --secondary: 24 100% 50%;       /* #FF6B00 naranja */
    --secondary-foreground: 0 0% 100%;
    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 63%;
    --accent: 43 100% 48%;
    --accent-foreground: 0 0% 0%;
    --destructive: 0 84% 60%;
    --border: 0 0% 17%;             /* #2A2A2A */
    --input: 0 0% 10%;
    --ring: 43 100% 48%;
    --radius: 0.75rem;
  }
}
/* NADA MÁS — todo lo demás va en className con Tailwind */
```

### Clases Tailwind de uso frecuente en este proyecto

```jsx
// Tarjeta base
<Card className="bg-bg-surface border border-bg-border rounded-card">

// Botón primario amarillo
<Button className="bg-brand-yellow text-black font-bold hover:bg-brand-hover">

// Botón naranja (acción secundaria)
<Button className="bg-brand-orange text-white hover:opacity-90">

// Badge de estado PENDIENTE
<Badge className="bg-brand-orange/20 text-brand-orange border-brand-orange/30">

// Badge de estado PAGADO
<Badge className="bg-state-success/20 text-state-success border-state-success/30">

// Badge de estado CANCELADO
<Badge className="bg-state-error/20 text-state-error border-state-error/30">

// Input oscuro
<Input className="bg-bg-elevated border-bg-border text-white focus:border-brand-yellow">

// Texto secundario
<p className="text-zinc-400 text-sm">

// Separador
<Separator className="bg-bg-border">

// Card con efecto glow al hover
<Card className="hover:shadow-glow hover:border-brand-yellow/30 transition-all duration-200">
```

---

## 9. Estructura de Carpetas del Proyecto

```
restaurante-app/
├── public/
│   └── sounds/
│       └── nuevo-pedido.mp3
│
├── src/
│   ├── index.css                ← ÚNICO archivo CSS (solo variables shadcn/ui + @tailwind)
│   │
│   ├── lib/
│   │   ├── supabase.js          ← Cliente Supabase configurado
│   │   └── utils.js             ← cn() helper de shadcn/ui (clsx + tailwind-merge)
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                  ← Componentes shadcn/ui (auto-generados con CLI)
│   │   │   ├── button.jsx       ← npx shadcn-ui@latest add button
│   │   │   ├── card.jsx         ← npx shadcn-ui@latest add card
│   │   │   ├── dialog.jsx       ← npx shadcn-ui@latest add dialog
│   │   │   ├── sheet.jsx        ← npx shadcn-ui@latest add sheet
│   │   │   ├── input.jsx        ← npx shadcn-ui@latest add input
│   │   │   ├── badge.jsx        ← npx shadcn-ui@latest add badge
│   │   │   ├── table.jsx        ← npx shadcn-ui@latest add table
│   │   │   ├── tabs.jsx         ← npx shadcn-ui@latest add tabs
│   │   │   ├── select.jsx       ← npx shadcn-ui@latest add select
│   │   │   ├── separator.jsx    ← npx shadcn-ui@latest add separator
│   │   │   ├── toast.jsx        ← npx shadcn-ui@latest add toast
│   │   │   ├── avatar.jsx       ← npx shadcn-ui@latest add avatar
│   │   │   ├── dropdown-menu.jsx
│   │   │   └── alert-dialog.jsx
│   │   │
│   │   ├── factura/
│   │   │   ├── FacturaPDF.jsx   ← Plantilla HTML de factura (jsPDF + html2canvas)
│   │   │   └── FacturaModal.jsx ← Dialog de shadcn/ui que envuelve la factura
│   │   │
│   │   ├── cajero/
│   │   │   ├── ColaPedidos.jsx
│   │   │   ├── TarjetaPedido.jsx    ← Card shadcn mostrando nombre cliente + estado
│   │   │   ├── DetallePedido.jsx
│   │   │   ├── ModuloCobro.jsx
│   │   │   └── BilletesRapidos.jsx  ← Botones Tailwind de billetes COP
│   │   │
│   │   ├── mesero/
│   │   │   ├── MenuVisual.jsx
│   │   │   ├── CuadriculaMesas.jsx
│   │   │   ├── ComandaActiva.jsx    ← Sheet de shadcn/ui
│   │   │   └── FormNombreCliente.jsx ← Input shadcn/ui obligatorio
│   │   │
│   │   └── admin/
│   │       ├── GestionMesas.jsx
│   │       ├── GestionCategorias.jsx
│   │       ├── GestionProductos.jsx
│   │       ├── GestionEgresos.jsx
│   │       ├── GestionUsuarios.jsx
│   │       └── DashboardContabilidad.jsx
│   │
│   ├── hooks/                   ← Hooks con React Query
│   │   ├── usePedidos.js
│   │   ├── useProductos.js
│   │   ├── useMesas.js
│   │   ├── useCategorias.js
│   │   ├── useEgresos.js
│   │   ├── useContabilidad.js
│   │   └── useRealtimePedidos.js
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Mesero.jsx
│   │   ├── Cajero.jsx
│   │   └── Admin.jsx
│   │
│   ├── stores/
│   │   ├── comandaStore.js
│   │   └── authStore.js
│   │
│   ├── utils/
│   │   ├── formatCOP.js
│   │   ├── generarCodigo.js
│   │   └── calcularCambio.js
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env                         ← SUPABASE_URL + SUPABASE_ANON_KEY
├── tailwind.config.js           ← Colores, fuentes y tokens del sistema de diseño
├── components.json              ← Configuración de shadcn/ui
└── vite.config.js
```

### Instalación inicial del proyecto

```bash
# 1. Crear proyecto
npm create vite@latest restaurante-app -- --template react
cd restaurante-app

# 2. Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p

# 3. Instalar shadcn/ui
npx shadcn-ui@latest init
# → Seleccionar: Dark theme · CSS variables · zinc como base

# 4. Agregar todos los componentes necesarios
npx shadcn-ui@latest add button card dialog sheet input badge table tabs select separator toast avatar dropdown-menu alert-dialog

# 5. Instalar dependencias del proyecto
npm install @supabase/supabase-js @tanstack/react-query zustand
npm install date-fns recharts lucide-react
npm install jspdf html2canvas
npm install react-router-dom
```

---

## 10. Flujos de Prueba y Validación

### Escenario 1 — Pedido completo de mesa
1. Login como **Mesero** → seleccionar "Mesa" → escribir nombre del cliente "Juan"
2. Seleccionar Mesa 3 en la cuadrícula
3. Agregar 1 *Arepa de Carne* con nota "Sin cebolla" + 1 *Jugo Natural*
4. Presionar "Enviar Comanda a Caja"
5. **Verificar:** cambiar a la pantalla de **Cajero** → aparece la comanda de Juan, Mesa 3 en tiempo real
6. Abrir el pedido → presionar billete rápido `$50,000`
7. **Verificar:** sistema muestra `Cambio: $28,000 COP` (si total = $22,000)
8. Confirmar cobro → estado cambia a `PAGADO`
9. Abrir la factura → verificar que aparece nombre del cliente, nota "Sin cebolla", total, cambio

### Escenario 2A — Domicilio registrado por el Mesero
1. Login como **Mesero** → seleccionar "Domicilio" → escribir nombre "María López" y teléfono
2. Elegir tipo **LLEVAR** → ingresar dirección
3. Agregar productos con notas y enviar
4. **Verificar:** en la pantalla del **Cajero** tab "Domicilios", aparece la tarjeta de María López con tipo LLEVAR
5. Procesar cobro por Transferencia → estado `PAGADO` → generar factura

### Escenario 2B — Domicilio registrado directamente por el Cajero
1. Login como **Cajero** → ir al tab "Domicilios" → presionar "Nuevo Domicilio"
2. **Paso 1:** llenar nombre "Carlos Ruiz", teléfono, elegir tipo **RECOGER**
3. **Verificar:** el campo de dirección desaparece automáticamente al elegir RECOGER
4. **Paso 2:** agregar 2 Hamburguesas con nota "sin tomate" + 2 Jugos → total $36,000
5. **Paso 3:** procesar cobro en efectivo con billete $50,000
6. **Verificar:** sistema muestra cambio `$14,000 COP`
7. Confirmar → estado `PAGADO` → factura generada con datos del domicilio

### Escenario 3 — Control de contabilidad (Admin)
1. Login como **Admin** → ir a módulo "Egresos"
2. Registrar egreso: "Compra de carne — Proveedor X" · Categoría: INSUMOS · $100,000 COP
3. **Verificar:** en el Dashboard, "Total Egresos" se actualiza a $100,000
4. **Verificar:** "Utilidad Neta" = Ingresos del día - $100,000
5. **Verificar:** el gráfico de egresos por categoría muestra INSUMOS

### Escenario 4 — Cierre de caja diario (Cajero)
1. Al final del día, el cajero abre el "Resumen del Día"
2. **Verificar:** muestra total en efectivo (para contar billetes) y total en transferencia por separado
3. **Verificar:** lista todos los pedidos pagados con su detalle

### Escenario 5 — Gestión de Admin
1. Login como **Admin** → crear nueva mesa "Mesa 5" con capacidad 6
2. **Verificar:** la nueva mesa aparece en la cuadrícula del Mesero
3. Crear categoría "Postres" → crear producto "Brownie" a $7,000
4. **Verificar:** el Mesero puede ver "Postres" y el "Brownie" en el menú
5. Editar precio del "Brownie" a $8,000
6. **Verificar:** el próximo pedido con "Brownie" registra $8,000, no $7,000

---

## ✅ Checklist de Mejoras Aplicadas

| # | Problema Original | Solución Implementada |
|---|---|---|
| 1 | No había modelo de Mesa | Tabla `mesas` completa, el Admin la crea/edita/elimina |
| 2 | Inventario complejo sin utilidad clara | Reemplazado por módulo `egresos` simple y potente para contabilidad |
| 3 | Faltaba estado `PAGADO` | Estados: PENDIENTE → EN_PROCESO → PAGADO → ENTREGADO → CANCELADO |
| 4 | Sin notas por ítem en DetallePedido | Campo `notas` añadido en `detalle_pedido` |
| 5 | Sin nombre del cliente en pantalla del Mesero | Campo **obligatorio** — se guarda en el pedido y se muestra en caja |
| 6 | Contabilidad básica | Dashboard completo: 6 KPIs, 5 gráficas, filtros, cierre diario |
| 7 | Diseño no especificado | shadcn/ui + Tailwind exclusivo, negro/amarillo/naranja |
| 8 | Factura incompleta | PDF completo con cliente, notas, cambio, cajero, hora |
| 9 | Sincronización no definida | Supabase Realtime + React Query con hook `useRealtimePedidos` |
| 10 | Estructura de proyecto no definida | Árbol de carpetas completo con comandos de instalación |
| 11 | CSS plano mezclado con Tailwind | **Regla absoluta:** 100% Tailwind, cero .css propios |
| 12 | Sin librería de componentes profesional | **shadcn/ui** integrado con tema oscuro personalizado |
| 13 | Nombre del cliente no llegaba a caja | Nombre visible en cada tarjeta de pedido en la pantalla del cajero |
| 14 | Faltaba costo de envío | Campo `costo_domicilio` añadido en la base de datos y UI de cobro |
| 15 | No había control de cierre de caja | Tabla `cierres_caja` y flujo de caja (efectivo vs transferencia) |
| 16 | Aviso a cocina manual | Apartado "Mis Pedidos" para el mesero con detalles para aviso verbal |
| 17 | Login de mesero lento | Autenticación por PIN de 4 dígitos creado por el Admin |

---

*Plan de Implementación v2.3 — Actualizado con Autenticación por PIN para Meseros 🚀*
