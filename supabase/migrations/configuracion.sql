-- Tabla de Configuración Global
CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Datos iniciales de la factura (Valores por defecto)
INSERT INTO configuracion (clave, valor) VALUES 
('factura_nombre', 'BUEN PROVECHO'),
('factura_nit', '900.123.456-7'),
('factura_direccion', 'KRA 27 #12-16 BARRIO EL BOSQUE'),
('factura_telefono', '300 122 3317')
ON CONFLICT (clave) DO NOTHING;

-- Habilitar RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Permitir lectura a todos" ON configuracion FOR SELECT USING (true);
CREATE POLICY "Permitir gestión a autenticados" ON configuracion FOR ALL TO authenticated USING (true) WITH CHECK (true);
