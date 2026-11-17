-- Tabla de Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    telefono TEXT,
    cargo TEXT, -- 'COCINERO', 'DOMICILIARIO', 'MESERO', 'OTRO'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Extender egresos para trazabilidad de pagos a trabajadores
ALTER TABLE egresos ADD COLUMN IF NOT EXISTS trabajador_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (Permitir a usuarios autenticados gestionar trabajadores)
CREATE POLICY "Permitir todo a usuarios autenticados" ON trabajadores
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
