-- Create metas_ahorro table
CREATE TABLE public.metas_ahorro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  emoji TEXT DEFAULT '🎯',
  monto_objetivo NUMERIC NOT NULL CHECK (monto_objetivo > 0),
  monto_actual NUMERIC NOT NULL DEFAULT 0 CHECK (monto_actual >= 0),
  aporte_mensual_planeado NUMERIC DEFAULT 0,
  fecha_objetivo DATE,
  activa BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT '#16a34a',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metas_ahorro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metas" ON public.metas_ahorro FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own metas" ON public.metas_ahorro FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metas" ON public.metas_ahorro FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metas" ON public.metas_ahorro FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_metas_ahorro_updated_at BEFORE UPDATE ON public.metas_ahorro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
