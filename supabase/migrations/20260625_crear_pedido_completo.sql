-- c:\Users\Lenovo\.gemini\antigravity\scratch\restaurante-app\supabase\migrations\20260625_crear_pedido_completo.sql

-- 1. Eliminar DINÁMICAMENTE todas las versiones anteriores sobrecargadas en el esquema public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'crear_pedido_completo'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- 2. Crear la función unificada limpia
CREATE OR REPLACE FUNCTION public.crear_pedido_completo(
    p_codigo text,
    p_canal text,
    p_estado text,
    p_total numeric,
    p_nombre_cliente text,
    p_mesa_id int DEFAULT NULL,
    p_mesero_id uuid DEFAULT NULL,
    p_notas text DEFAULT NULL,
    p_items jsonb DEFAULT '[]'::jsonb
) RETURNS int AS $$
DECLARE
    v_pedido_id int;
    v_item jsonb;
BEGIN
    -- 1. Insertar el pedido en la tabla 'pedidos'
    INSERT INTO pedidos (
        codigo, 
        canal, 
        estado, 
        total, 
        nombre_cliente, 
        mesa_id, 
        mesero_id,
        notas,
        creado_en,
        actualizado_en
    ) VALUES (
        p_codigo, 
        p_canal, 
        p_estado, 
        p_total, 
        p_nombre_cliente, 
        p_mesa_id, 
        p_mesero_id,
        NULLIF(TRIM(p_notas), ''),
        now(),
        now()
    ) RETURNING id INTO v_pedido_id;

    -- 2. Iterar sobre los items e insertarlos en 'detalle_pedido'
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO detalle_pedido (
            pedido_id,
            producto_id,
            cantidad,
            precio_unitario,
            subtotal,
            notas 
        ) VALUES (
            v_pedido_id,
            (v_item->>'producto_id')::int,
            (v_item->>'cantidad')::int,
            (v_item->>'precio_unitario')::numeric,
            (v_item->>'subtotal')::numeric,
            v_item->>'notas'
        );
    END LOOP;

    RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql;
