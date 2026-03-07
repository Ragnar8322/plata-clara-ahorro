
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Gastos table
CREATE TABLE public.gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto >= 0),
  metodo_pago TEXT NOT NULL,
  tipo TEXT NOT NULL,
  frecuencia TEXT NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gastos" ON public.gastos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own gastos" ON public.gastos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own gastos" ON public.gastos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own gastos" ON public.gastos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_gastos_updated_at BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deudas table
CREATE TABLE public.deudas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  entidad TEXT NOT NULL,
  saldo_inicial NUMERIC NOT NULL CHECK (saldo_inicial >= 0),
  saldo_actual NUMERIC NOT NULL CHECK (saldo_actual >= 0),
  tasa_interes_anual NUMERIC NOT NULL CHECK (tasa_interes_anual >= 0),
  pago_minimo_mensual NUMERIC NOT NULL CHECK (pago_minimo_mensual >= 0),
  dia_corte_o_pago INTEGER NOT NULL CHECK (dia_corte_o_pago BETWEEN 1 AND 31),
  pago_extra_planeado_mensual NUMERIC NOT NULL DEFAULT 0 CHECK (pago_extra_planeado_mensual >= 0),
  activa BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deudas" ON public.deudas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deudas" ON public.deudas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deudas" ON public.deudas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deudas" ON public.deudas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_deudas_updated_at BEFORE UPDATE ON public.deudas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Configuracion table (one per user)
CREATE TABLE public.configuracion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ingreso_mensual_neto NUMERIC NOT NULL DEFAULT 0,
  moneda_simbolo TEXT NOT NULL DEFAULT '$',
  nombre_moneda TEXT NOT NULL DEFAULT 'COP',
  presupuesto_mensual_para_deudas NUMERIC NOT NULL DEFAULT 0,
  meses_max_proyeccion INTEGER NOT NULL DEFAULT 36,
  estrategia_orden_deudas TEXT NOT NULL DEFAULT 'SaldoAscendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own config" ON public.configuracion FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own config" ON public.configuracion FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own config" ON public.configuracion FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own config" ON public.configuracion FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
