/* 
  Tabla: presupuestos_categorias
  Permite a los usuarios definir un límite máximo de gasto mensual por categoría.
*/

CREATE TABLE IF NOT EXISTS presupuestos_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  limite_mensual NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Asegurar que un usuario no tenga dos presupuestos para la misma categoría
  UNIQUE(user_id, categoria)
);

-- RLS
ALTER TABLE presupuestos_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios presupuestos"
  ON presupuestos_categorias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios presupuestos"
  ON presupuestos_categorias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios presupuestos"
  ON presupuestos_categorias FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios presupuestos"
  ON presupuestos_categorias FOR DELETE
  USING (auth.uid() = user_id);
