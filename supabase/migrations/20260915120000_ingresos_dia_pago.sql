/*
  Día del mes en que entra cada fuente de ingreso. Permite calcular el "disponible hoy": cuánto de
  lo declarado ya se recibió a la fecha, en vez de dar por recibido todo el mes desde el día 1.

  `dia_pago_2` solo lo usa la frecuencia quincenal (el segundo pago del mes). Ambos son NULL para
  las fuentes existentes; el frontend cae a 15 y 30 para quincenal y al último día para mensual.
*/

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS dia_pago SMALLINT,
  ADD COLUMN IF NOT EXISTS dia_pago_2 SMALLINT;

ALTER TABLE ingresos
  DROP CONSTRAINT IF EXISTS ingresos_dia_pago_valido;

ALTER TABLE ingresos
  ADD CONSTRAINT ingresos_dia_pago_valido
  CHECK (
    (dia_pago IS NULL OR dia_pago BETWEEN 1 AND 31)
    AND (dia_pago_2 IS NULL OR dia_pago_2 BETWEEN 1 AND 31)
  );

-- Un segundo día de pago solo tiene sentido en una fuente quincenal; en cualquier otra sería un
-- dato muerto que el cálculo ignora pero el formulario podría mostrar.
ALTER TABLE ingresos
  DROP CONSTRAINT IF EXISTS ingresos_dia_pago_2_solo_quincenal;

ALTER TABLE ingresos
  ADD CONSTRAINT ingresos_dia_pago_2_solo_quincenal
  CHECK (dia_pago_2 IS NULL OR frecuencia = 'Quincenal');
