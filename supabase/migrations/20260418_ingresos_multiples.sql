/* 
  Tabla: ingresos
  Permite a los usuarios registrar múltiples fuentes de ingreso (ej. Sueldo, Arriendos, Freelance).
*/

CREATE TABLE IF NOT EXISTS ingresos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL, -- Ej: "Sueldo Principal"
  monto NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT DEFAULT 'Otros', -- Ej: 'Sueldo', 'Inversión', 'Venta'
  frecuencia TEXT DEFAULT 'Mensual', -- Ej: 'Quincenal', 'Mensual', 'Variable'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios ingresos"
  ON ingresos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propios ingresos"
  ON ingresos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios ingresos"
  ON ingresos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios ingresos"
  ON ingresos FOR DELETE
  USING (auth.uid() = user_id);
