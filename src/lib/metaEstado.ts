import { MetaAhorro } from "@/types";

export function metaCompletada(meta: MetaAhorro): boolean {
  return meta.monto_objetivo > 0 && meta.monto_actual >= meta.monto_objetivo;
}

/**
 * Una meta cuenta en el plan mientras el usuario no la archive; alcanzar el objetivo no la saca.
 *
 * Antes `activa` cargaba dos significados a la vez ("sin terminar" y "cuenta en mi plan"): al
 * completar una meta se ponía en false y la meta desaparecía del dashboard, del reporte y del
 * score de salud, que caía 25 puntos por haber tenido éxito. Incluir aquí las metas ya cumplidas
 * también recupera las que quedaron marcadas como inactivas por ese comportamiento.
 */
export function metaEnPlan(meta: MetaAhorro): boolean {
  return meta.activa || metaCompletada(meta);
}

/** Progreso 0–1, con guarda para objetivos en 0 (que producían NaN%). */
export function progresoMeta(meta: MetaAhorro): number {
  if (meta.monto_objetivo <= 0) return 0;
  return Math.min(1, meta.monto_actual / meta.monto_objetivo);
}
