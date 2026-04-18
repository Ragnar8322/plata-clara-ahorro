import { supabase } from "@/integrations/supabase/client";
import { MetaAhorro } from "@/types";

export async function loadMetas(): Promise<MetaAhorro[]> {
  const { data, error } = await supabase
    .from("metas_ahorro")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      // Table doesn't exist yet, return empty
      return [];
    }
    throw error;
  }
  return data || [];
}

export async function saveMeta(meta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">, userId: string): Promise<MetaAhorro> {
  const { data, error } = await supabase
    .from("metas_ahorro")
    .insert([{ ...meta, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMeta(meta: MetaAhorro): Promise<MetaAhorro> {
  const { data, error } = await supabase
    .from("metas_ahorro")
    .update({
      nombre: meta.nombre,
      emoji: meta.emoji,
      monto_objetivo: meta.monto_objetivo,
      monto_actual: meta.monto_actual,
      aporte_mensual_planeado: meta.aporte_mensual_planeado,
      fecha_objetivo: meta.fecha_objetivo,
      activa: meta.activa,
      color: meta.color,
      notas: meta.notas,
      updated_at: new Date().toISOString()
    })
    .eq("id", meta.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMeta(id: string): Promise<void> {
  const { error } = await supabase
    .from("metas_ahorro")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
