-- ACTUALIZACIÓN DE ESQUEMA V2.1.1 --
-- Conecta la tabla de Egresos con el Administrador que registra --

ALTER TABLE public.egresos 
ADD COLUMN registrado_por UUID REFERENCES public.usuarios(id);

-- Actualizar política para permitir ver quién registró --
CREATE POLICY "Admin ve quien registro egresos" ON public.egresos FOR ALL USING (auth.role() = 'authenticated');
