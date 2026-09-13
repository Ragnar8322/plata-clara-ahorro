import { supabase } from "@/integrations/supabase/client";
import { MetaAhorro } from "@/types";

type FilaMeta = {
  id: string;
  user_id: string;
  nombre: string;
  emoji: string | null;
  monto_objetivo: number;
  monto_actual: number;
  aporte_mensual_planeado: number | null;
  fecha_objetivo: string | null;
  activa: boolean;
  color: string | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * En la base `emoji`, `color` y `aporte_mensual_planeado` admiten NULL, pero `MetaAhorro` los
 * declara obligatorios. Devolver la fila cruda colaba esos nulos hasta la interfaz: una meta sin
 * emoji pintaba "null" en la tarjeta y `falta / null` daba Infinity en la fecha estimada.
 */
function mapMeta(row: FilaMeta): MetaAhorro {
  return {
    id: row.id,
    user_id: row.user_id,
    nombre: row.nombre,
    emoji: row.emoji ?? "🎯",
    monto_objetivo: Number(row.monto_objetivo),
    monto_actual: Number(row.monto_actual),
    aporte_mensual_planeado: Number(row.aporte_mensual_planeado ?? 0),
    fecha_objetivo: row.fecha_objetivo ?? undefined,
    activa: row.activa,
    color: row.color ?? "#16a34a",
    notas: row.notas ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

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
  return (data || []).map(mapMeta);
}

export async function saveMeta(meta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">, userId: string): Promise<MetaAhorro> {
  const { data, error } = await supabase
    .from("metas_ahorro")
    .insert([{ ...meta, fecha_objetivo: meta.fecha_objetivo || null, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return mapMeta(data);
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
      fecha_objetivo: meta.fecha_objetivo || null,
      activa: meta.activa,
      color: meta.color,
      notas: meta.notas,
      updated_at: new Date().toISOString()
    })
    .eq("id", meta.id)
    .select()
    .single();

  if (error) throw error;
  return mapMeta(data);
}

export async function deleteMeta(id: string): Promise<void> {
  const { error } = await supabase
    .from("metas_ahorro")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
