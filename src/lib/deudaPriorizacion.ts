import { Deuda, PagoDeuda, EstrategiaOrden } from "@/types";
import { calcularDiasMora } from "./moraCalculator";

/**
 * Comparador compartido de estrategia de pago: bola de nieve (menor saldo
 * primero) o avalancha (mayor tasa de interés primero). Usado tanto por la
 * simulación de proyección como por la recomendación de la página Resumen.
 */
export function compararPorEstrategia(
  a: { saldo: number; tasaAnual: number },
  b: { saldo: number; tasaAnual: number },
  estrategia: EstrategiaOrden
): number {
  return estrategia === "SaldoAscendente" ? a.saldo - b.saldo : b.tasaAnual - a.tasaAnual;
}

export interface RecomendacionPago {
  deuda: Deuda;
  diasMora: number;
  razon: string;
}

/**
 * Recomienda cuál deuda pagar primero: prioriza la que tenga más días de
 * mora; si ninguna está en mora, cae a la estrategia configurada por el
 * usuario (bola de nieve o avalancha).
 */
export function recomendarProximaDeuda(
  deudas: Deuda[],
  pagos: PagoDeuda[],
  estrategia: EstrategiaOrden,
  hoy: Date = new Date()
): RecomendacionPago | null {
  const activas = deudas.filter((d) => d.activa && d.saldoActual > 0);
  if (activas.length === 0) return null;

  const conMora = activas
    .map((d) => ({ deuda: d, diasMora: calcularDiasMora(d, pagos, hoy) }))
    .filter((x) => x.diasMora > 0)
    .sort((x, y) => {
      if (y.diasMora !== x.diasMora) return y.diasMora - x.diasMora;
      return compararPorEstrategia(
        { saldo: x.deuda.saldoActual, tasaAnual: x.deuda.tasaInteresAnual },
        { saldo: y.deuda.saldoActual, tasaAnual: y.deuda.tasaInteresAnual },
        estrategia
      );
    });

  if (conMora.length > 0) {
    const top = conMora[0];
    return {
      deuda: top.deuda,
      diasMora: top.diasMora,
      razon: `${top.diasMora} ${top.diasMora === 1 ? "día" : "días"} de mora`,
    };
  }

  const [elegida] = [...activas].sort((a, b) =>
    compararPorEstrategia(
      { saldo: a.saldoActual, tasaAnual: a.tasaInteresAnual },
      { saldo: b.saldoActual, tasaAnual: b.tasaInteresAnual },
      estrategia
    )
  );

  return {
    deuda: elegida,
    diasMora: 0,
    razon:
      estrategia === "SaldoAscendente"
        ? "Menor saldo, estrategia bola de nieve"
        : "Mayor tasa de interés, estrategia avalancha",
  };
}
