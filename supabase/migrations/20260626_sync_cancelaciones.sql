-- ============================================================
-- MIGRACIÓN: Sincronización de columnas para cancelaciones y auditoría
-- Fecha: 2026-06-26
-- Propósito: Añadir soporte completo para la cancelación de pedidos/domicilios
--            y la trazabilidad por cajero implementadas en el frontend.
-- ============================================================

-- 1. Columna para identificar qué cajero procesó o canceló el pedido
ALTER TABLE pedidos 
  ADD COLUMN IF NOT EXISTS cajero_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN pedidos.cajero_id IS 
  'ID del cajero que procesó el cobro o la cancelación del pedido';

-- 2. Columna para registrar el motivo de cancelación (trazabilidad)
ALTER TABLE pedidos 
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT DEFAULT NULL;

COMMENT ON COLUMN pedidos.motivo_cancelacion IS 
  'Motivo por el cual se canceló el pedido. NULL si no fue cancelado.';

-- 3. Columna para datos de domicilio (nombre del cliente de entrega)
--    Por si no existe aún — es usada en TabDomicilios.jsx
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS nombre_cliente_dom TEXT DEFAULT NULL;

COMMENT ON COLUMN pedidos.nombre_cliente_dom IS 
  'Nombre del destinatario del domicilio (puede diferir del cliente que pidió)';

-- 4. Columna para dirección de entrega de domicilios
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS direccion_cliente TEXT DEFAULT NULL;

COMMENT ON COLUMN pedidos.direccion_cliente IS 
  'Dirección de entrega del domicilio';

-- ============================================================
-- VERIFICACIÓN: Ejecuta esto para confirmar que las columnas existen
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'pedidos' 
--   AND column_name IN ('cajero_id', 'motivo_cancelacion', 'nombre_cliente_dom', 'direccion_cliente')
-- ORDER BY column_name;
-- ============================================================
