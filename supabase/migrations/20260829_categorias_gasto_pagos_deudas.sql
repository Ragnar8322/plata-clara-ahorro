-- Create categorias_gasto table
CREATE TABLE public.categorias_gasto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_gasto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categorias_gasto" ON public.categorias_gasto FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categorias_gasto" ON public.categorias_gasto FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categorias_gasto" ON public.categorias_gasto FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categorias_gasto" ON public.categorias_gasto FOR DELETE USING (auth.uid() = user_id);

-- Create pagos_deudas table
CREATE TABLE public.pagos_deudas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deuda_id UUID NOT NULL REFERENCES public.deudas(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL CHECK (monto >= 0),
  fecha DATE NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos_deudas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pagos_deudas" ON public.pagos_deudas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own pagos_deudas" ON public.pagos_deudas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pagos_deudas" ON public.pagos_deudas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pagos_deudas" ON public.pagos_deudas FOR DELETE USING (auth.uid() = user_id);
