import { Ingreso, FrecuenciaIngreso, FRECUENCIAS_INGRESO } from "@/types";
import { clampDiaDelMes, diasEnMes } from "@/lib/fechas";

export const DIA_PAGO_QUINCENA_1 = 15;
export const DIA_PAGO_QUINCENA_2 = 30;

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

/**
 * Días del mes en que entra esta fuente, ya ajustados al calendario real (un pago el 30 cae el 28
 * en febrero). Una fuente variable se considera disponible desde el primer día: no tiene una fecha
 * de consignación conocida y dejarla fuera subestimaría el disponible todo el mes.
 */
export function diasDePago(ingreso: Ingreso, anio: number, mes: number): number[] {
  const clamp = (dia: number) => clampDiaDelMes(dia, anio, mes);

  switch (normalizarFrecuencia(ingreso.frecuencia)) {
    case "Variable":
      return [1];
    case "Mensual":
      return [clamp(ingreso.dia_pago ?? diasEnMes(anio, mes))];
    case "Quincenal":
      return [
        clamp(ingreso.dia_pago ?? DIA_PAGO_QUINCENA_1),
        clamp(ingreso.dia_pago_2 ?? DIA_PAGO_QUINCENA_2),
      ];
  }
}

/** Cuánto de esta fuente ya entró en el mes de `hoy`, contando solo los pagos cuya fecha ya llegó. */
export function montoRecibidoEsteMes(ingreso: Ingreso, hoy: Date): number {
  const pagosLlegados = diasDePago(ingreso, hoy.getFullYear(), hoy.getMonth())
    .filter((dia) => hoy.getDate() >= dia).length;
  return (ingreso?.monto || 0) * pagosLlegados;
}

export function totalRecibidoEsteMes(ingresos: Ingreso[], hoy: Date): number {
  return (ingresos || []).reduce((suma, ing) => suma + montoRecibidoEsteMes(ing, hoy), 0);
}

/** Cuántos pagos del mes ya entraron, sobre el total esperado. Alimenta el subtítulo del disponible. */
export function conteoPagosDelMes(ingresos: Ingreso[], hoy: Date): { recibidos: number; totales: number } {
  return (ingresos || []).reduce(
    (acc, ing) => {
      const dias = diasDePago(ing, hoy.getFullYear(), hoy.getMonth());
      return {
        recibidos: acc.recibidos + dias.filter((dia) => hoy.getDate() >= dia).length,
        totales: acc.totales + dias.length,
      };
    },
    { recibidos: 0, totales: 0 }
  );
}

/** Día del mes del siguiente pago pendiente, o null si ya entraron todos los del mes. */
export function proximoDiaDePago(ingresos: Ingreso[], hoy: Date): number | null {
  const pendientes = (ingresos || [])
    .flatMap((ing) => diasDePago(ing, hoy.getFullYear(), hoy.getMonth()))
    .filter((dia) => dia > hoy.getDate())
    .sort((a, b) => a - b);
  return pendientes[0] ?? null;
}
