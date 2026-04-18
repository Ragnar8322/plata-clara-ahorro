import { Deuda, Ingreso, MetaAhorro, Gasto } from "@/types";

/**
 * Calcula el Score de Salud Financiera (0-100)
 */
export function calculateHealthScore(
  ingresos: Ingreso[],
  deudas: Deuda[],
  metas: MetaAhorro[],
  gastos: Gasto[],
  mesKey: string // Para filtrar gastos del mes actual si es necesario
): number {
  let score = 0;

  // 1. Cálculos Base
  const ingresoTotal = ingresos.reduce((s, i) => s + i.monto, 0) || 1; // Evitar división por cero
  const totalMinimos = deudas.filter(d => d.activa).reduce((s, d) => s + d.pagoMinimoMensual, 0);
  const totalGastosMes = gastos
    .filter(g => g.fecha.startsWith(mesKey))
    .reduce((s, g) => s + g.monto, 0);
  
  const margen = ingresoTotal - totalGastosMes - totalMinimos;
  const metasActivas = metas.filter(m => m.activa);

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

  // 4. Componente 3: Progreso Metas (40 pts max)
  if (metasActivas.length === 0) {
    score += 15; // Neutral
  } else {
    const totalActual = metasActivas.reduce((s, m) => s + m.monto_actual, 0);
    const totalObjetivo = metasActivas.reduce((s, m) => s + m.monto_objetivo, 0);
    const progreso = totalObjetivo > 0 ? (totalActual / totalObjetivo) : 0;

    if (progreso >= 0.5) score += 40;
    else if (progreso >= 0.25) score += 30;
    else if (progreso > 0) score += 20;
    else score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
}
