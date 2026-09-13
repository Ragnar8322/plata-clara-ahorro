-- La política de INSERT/UPDATE sobre pagos_deudas solo comprobaba `user_id`, no la propiedad de
-- `deuda_id`. Eso permitía crear un pago que apunta a la deuda de otra cuenta: el trigger no puede
-- alterar ese saldo ajeno (RLS filtra el UPDATE sobre `deudas`), pero la fila huérfana se crea sin
-- error y corrompe el historial y los totales del propio usuario.

DROP POLICY IF EXISTS "Users can insert their own pagos" ON public.pagos_deudas;
DROP POLICY IF EXISTS "Users can insert own pagos_deudas" ON public.pagos_deudas;
DROP POLICY IF EXISTS "pagos_deudas_insert_own" ON public.pagos_deudas;

CREATE POLICY "pagos_deudas_insert_own"
ON public.pagos_deudas
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.deudas d
    WHERE d.id = deuda_id AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own pagos" ON public.pagos_deudas;
DROP POLICY IF EXISTS "Users can update own pagos_deudas" ON public.pagos_deudas;
DROP POLICY IF EXISTS "pagos_deudas_update_own" ON public.pagos_deudas;

CREATE POLICY "pagos_deudas_update_own"
ON public.pagos_deudas
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.deudas d
    WHERE d.id = deuda_id AND d.user_id = auth.uid()
  )
);
