-- Corrige la asimetría del trigger de pagos: al INSERTAR se recortaba el saldo con
-- GREATEST(saldo_actual - monto, 0), pero al BORRAR se devolvía OLD.monto completo, sin recorte.
-- El excedente perdido al insertar reaparecía como deuda inventada.
--
--   Deuda $1.500.000 · se reporta un pago de $2.000.000 -> saldo $0 (se pierden $500.000)
--   se borra ese pago                                   -> saldo $2.000.000  ← $500.000 falsos
--
-- En vez de compensarlo después (imposible: la información del recorte ya se perdió), se evita
-- en origen: un pago nunca puede superar el saldo pendiente de su deuda. Así el descuento del
-- INSERT siempre es exacto y devolverlo en el DELETE vuelve a ser simétrico.

CREATE OR REPLACE FUNCTION public.validar_pago_no_supera_saldo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  saldo_pendiente numeric;
  saldo_disponible numeric;
BEGIN
  SELECT saldo_actual INTO saldo_pendiente FROM public.deudas WHERE id = NEW.deuda_id;

  -- Si la deuda no es visible para este usuario, RLS ya bloquea la escritura sobre `deudas`.
  IF saldo_pendiente IS NULL THEN
    RETURN NEW;
  END IF;

  -- Al EDITAR un pago, el monto anterior todavía está descontado del saldo: vuelve a estar
  -- disponible para este mismo pago.
  saldo_disponible := saldo_pendiente;
  IF TG_OP = 'UPDATE' AND OLD.deuda_id = NEW.deuda_id THEN
    saldo_disponible := saldo_disponible + OLD.monto;
  END IF;

  IF NEW.monto > saldo_disponible THEN
    RAISE EXCEPTION
      'El pago (%) supera el saldo pendiente de la deuda (%).', NEW.monto, saldo_disponible
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_pago_no_supera_saldo ON public.pagos_deudas;

CREATE TRIGGER trg_validar_pago_no_supera_saldo
BEFORE INSERT OR UPDATE ON public.pagos_deudas
FOR EACH ROW EXECUTE FUNCTION public.validar_pago_no_supera_saldo();
