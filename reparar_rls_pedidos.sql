-- SCRIPT PARA REPARAR PERMISOS (RLS) EN TABLAS DE PEDIDOS
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Habilitar RLS (por si acaso)
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos (Opcional)
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON pedidos;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON detalle_pedido;

-- 3. Crear nuevas políticas simplificadas para un entorno POS
-- Esto permite que cualquier usuario autenticado (con el API Key del proyecto) pueda operar
CREATE POLICY "Permitir todo a usuarios autenticados" 
ON pedidos 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados" 
ON detalle_pedido 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Asegurar permisos en el esquema public para el rol authenticated
GRANT ALL ON TABLE pedidos TO authenticated;
GRANT ALL ON TABLE detalle_pedido TO authenticated;
GRANT ALL ON SEQUENCE pedidos_id_seq TO authenticated;
GRANT ALL ON SEQUENCE detalle_pedido_id_seq TO authenticated;

-- Nota: Si tienes otras tablas como 'detalle_pedido' que fallan, este script ya lo cubre.
