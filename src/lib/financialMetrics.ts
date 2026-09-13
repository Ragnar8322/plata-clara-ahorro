import { Deuda, Ingreso, MetaAhorro, Gasto } from "@/types";
import { metaEnPlan } from "@/lib/metaEstado";

/**
 * Calcula el Score de Salud Financiera (0-100)
 */
export function calculateHealthScore(
  ingresos: Ingreso[],
  deudas: Deuda[],
  metas: MetaAhorro[],
  gastos: Gasto[],
  mesKey: string, // Para filtrar gastos del mes actual si es necesario
  ingresoMensualNeto: number
): number {
  let score = 0;

  // 1. Cálculos Base
  const safeIngresos = ingresos || [];
  const safeDeudas = deudas || [];
  const safeMetas = metas || [];
  const safeGastos = gastos || [];

  // El respaldo a la configuración se activa cuando no hay ingresos registrados *o* cuando suman
  // cero: antes bastaba una fuente en $0 para anular el ingreso configurado y hundir el score.
  const sumaIngresos = safeIngresos.reduce((s, i) => s + (i.monto || 0), 0);
  const ingresoTotal = sumaIngresos > 0 ? sumaIngresos : Math.max(ingresoMensualNeto || 0, 0);
  const tieneIngreso = ingresoTotal > 0;

  const totalMinimos = safeDeudas
    .filter(d => d && d.activa)
    .reduce((s, d) => s + (d.pagoMinimoMensual || 0), 0);

  // Los pagos de deuda ya se cuentan en `totalMinimos`. Si además se suman los gastos que el
  // usuario clasificó como "Deudas", el mismo dinero se resta dos veces del margen.
  const totalGastosMes = safeGastos
    .filter(g => g && g.fecha && g.fecha.startsWith(mesKey) && g.categoria !== "Deudas")
    .reduce((s, g) => s + (g.monto || 0), 0);

  const margen = ingresoTotal - totalGastosMes - totalMinimos;
  const metasActivas = safeMetas.filter(m => m && metaEnPlan(m));

  // Sin ingreso conocido no se pueden evaluar el endeudamiento ni la capacidad de ahorro.
  // Antes una guarda `|| 1` fingía un ingreso de $1 y regalaba los 60 puntos de ambos tramos.
  if (tieneIngreso) {
    // 2. Componente 1: Endeudamiento (30 pts max)
    const ratioDeuda = totalMinimos / ingresoTotal;
    if (ratioDeuda <= 0.15) score += 30;
    else if (ratioDeuda <= 0.3) score += 20;
    else if (ratioDeuda <= 0.45) score += 10;

    // 3. Componente 2: Capacidad Ahorro (30 pts max)
    const ratioAhorro = margen / ingresoTotal;
    if (ratioAhorro >= 0.2) score += 30;
    else if (ratioAhorro >= 0.1) score += 20;
    else if (ratioAhorro > 0) score += 10;
  }

  // 4. Componente 3: Progreso Metas (40 pts max)
  if (metasActivas.length === 0) {
    score += 15; // Neutral
  } else {
    const totalActual = metasActivas.reduce((s, m) => s + (m.monto_actual || 0), 0);
    const totalObjetivo = metasActivas.reduce((s, m) => s + (m.monto_objetivo || 0), 0);
    const progreso = totalObjetivo > 0 ? (totalActual / totalObjetivo) : 0;

    if (progreso >= 0.5) score += 40;
    else if (progreso >= 0.25) score += 30;
    else if (progreso > 0) score += 20;
    else score += 10;
  }

  // Gastar más de lo que se ingresa no puede leerse como "Saludable" (60+). El componente de
  // metas es independiente de la solvencia y por sí solo alcanzaba para 70/100 a alguien que
  // gastó el triple de lo que ganó en el mes.
  if (tieneIngreso && margen < 0) {
    score = Math.min(score, 45);
  }

  return Math.min(Math.max(score, 0), 100);
}
