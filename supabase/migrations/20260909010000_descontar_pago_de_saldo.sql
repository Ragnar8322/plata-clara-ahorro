-- Mantiene deudas.saldo_actual sincronizado con pagos_deudas: registrar,
-- editar o borrar un pago ajusta el saldo automáticamente. Solo se aplica a
-- pagos nuevos a partir de ahora (no re-procesa pagos_deudas históricos), así
-- que un saldo_actual ya vigente/actualizado manualmente no se ve afectado.
-- SECURITY INVOKER (por defecto): la actualización sobre deudas queda sujeta
-- a las mismas políticas RLS que la operación original, así que un pago no
-- puede alterar el saldo de una deuda que no pertenece al mismo usuario.
CREATE OR REPLACE FUNCTION public.aplicar_pago_a_deuda()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.deudas
    SET saldo_actual = GREATEST(saldo_actual - NEW.monto, 0)
    WHERE id = NEW.deuda_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deuda_id = NEW.deuda_id THEN
      UPDATE public.deudas
      SET saldo_actual = GREATEST(saldo_actual + OLD.monto - NEW.monto, 0)
      WHERE id = NEW.deuda_id;
    ELSE
      UPDATE public.deudas SET saldo_actual = saldo_actual + OLD.monto WHERE id = OLD.deuda_id;
      UPDATE public.deudas SET saldo_actual = GREATEST(saldo_actual - NEW.monto, 0) WHERE id = NEW.deuda_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.deudas
    SET saldo_actual = saldo_actual + OLD.monto
    WHERE id = OLD.deuda_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_aplicar_pago_a_deuda
AFTER INSERT OR UPDATE OR DELETE ON public.pagos_deudas
FOR EACH ROW EXECUTE FUNCTION public.aplicar_pago_a_deuda();
