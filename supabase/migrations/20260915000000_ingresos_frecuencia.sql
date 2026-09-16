/*
  La frecuencia del ingreso pasa a ser un dato de negocio: el equivalente mensual se calcula
  multiplicándola (Quincenal = x2). Un valor inesperado silenciosamente se leería como "Mensual"
  y subestimaría el ingreso a la mitad, así que se restringe en la base.
*/

UPDATE ingresos
SET frecuencia = 'Mensual'
WHERE frecuencia IS NULL OR frecuencia NOT IN ('Quincenal', 'Mensual', 'Variable');

ALTER TABLE ingresos
  ALTER COLUMN frecuencia SET NOT NULL,
  ALTER COLUMN frecuencia SET DEFAULT 'Mensual';

ALTER TABLE ingresos
  DROP CONSTRAINT IF EXISTS ingresos_frecuencia_valida;

ALTER TABLE ingresos
  ADD CONSTRAINT ingresos_frecuencia_valida
  CHECK (frecuencia IN ('Quincenal', 'Mensual', 'Variable'));
