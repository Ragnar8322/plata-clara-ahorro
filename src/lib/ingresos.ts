import { Ingreso, FrecuenciaIngreso, FRECUENCIAS_INGRESO } from "@/types";

/** Cuántas veces al mes se recibe un ingreso de cada frecuencia. */
const PAGOS_POR_MES: Record<FrecuenciaIngreso, number> = {
  Quincenal: 2,
  Mensual: 1,
  Variable: 1, // El monto se captura como promedio mensual.
};

export const DESCRIPCION_FRECUENCIA: Record<FrecuenciaIngreso, string> = {
  Quincenal: "Se recibe dos veces al mes",
  Mensual: "Se recibe una vez al mes",
  Variable: "Monto promedio estimado al mes",
};

/**
 * Las filas guardadas antes de que la frecuencia fuera parte del formulario pueden traer NULL o un
 * valor libre. Sin este saneo, un valor desconocido rompería el cálculo del equivalente mensual.
 */
export function normalizarFrecuencia(valor: string | null | undefined): FrecuenciaIngreso {
  return FRECUENCIAS_INGRESO.includes(valor as FrecuenciaIngreso)
    ? (valor as FrecuenciaIngreso)
    : "Mensual";
}

/** Convierte el monto de una fuente a lo que realmente entra en un mes. */
export function montoMensualEquivalente(ingreso: Ingreso): number {
  const monto = ingreso?.monto || 0;
  return monto * PAGOS_POR_MES[normalizarFrecuencia(ingreso?.frecuencia)];
}

export function totalIngresoMensual(ingresos: Ingreso[]): number {
  return (ingresos || []).reduce((suma, ing) => suma + montoMensualEquivalente(ing), 0);
}

/**
 * Ingreso mensual con el que opera toda la app. El respaldo a la configuración se aplica también
 * cuando las fuentes registradas suman cero: de lo contrario bastaba añadir una fuente en $0 para
 * que el ingreso de toda la app pasara a 0.
 */
export function ingresoMensualEfectivo(ingresos: Ingreso[], ingresoMensualNeto: number): number {
  const suma = totalIngresoMensual(ingresos);
  return suma > 0 ? suma : Math.max(ingresoMensualNeto || 0, 0);
}
