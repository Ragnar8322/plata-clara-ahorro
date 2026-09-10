-- Permite "silenciar" una alerta de mora sin registrar un pago ficticio:
-- el saldo_actual ya refleja los pagos reales, así que reconocer un ciclo
-- como cubierto no debe crear una fila en pagos_deudas ni tocar el saldo.
ALTER TABLE public.deudas
  ADD COLUMN mora_reconocida_hasta DATE;
