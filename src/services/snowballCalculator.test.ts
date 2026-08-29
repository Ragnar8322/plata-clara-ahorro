import { describe, it, expect } from "vitest";
import { simularBolaDeNieve } from "./snowballCalculator";
import { Deuda } from "@/types";

function makeDeuda(overrides: Partial<Deuda>): Deuda {
  return {
    id: "id",
    nombre: "Deuda",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1000,
    saldoActual: 1000,
    tasaInteresAnual: 0,
    pagoMinimoMensual: 50,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
    ...overrides,
  };
}

describe("simularBolaDeNieve", () => {
  it("ordena por saldo ascendente (bola de nieve) cuando la estrategia es SaldoAscendente", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "grande", nombre: "Grande", saldoActual: 5000, pagoMinimoMensual: 50, tasaInteresAnual: 10 }),
      makeDeuda({ id: "chica", nombre: "Chica", saldoActual: 200, pagoMinimoMensual: 20, tasaInteresAnual: 5 }),
    ];

    const resultado = simularBolaDeNieve(deudas, 1000, 24, "SaldoAscendente", "2026-01");

    // La deuda con menor saldo debe pagarse primero (prioridad 1)
    const prioridad1 = resultado.ordenPago.find((d) => d.prioridad === 1);
    expect(prioridad1?.deudaId).toBe("chica");
  });

  it("ordena por tasa de interés descendente (avalancha) cuando la estrategia es InteresDescendente", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "bajaTasa", nombre: "BajaTasa", saldoActual: 200, pagoMinimoMensual: 20, tasaInteresAnual: 5 }),
      makeDeuda({ id: "altaTasa", nombre: "AltaTasa", saldoActual: 5000, pagoMinimoMensual: 50, tasaInteresAnual: 30 }),
    ];

    const resultado = simularBolaDeNieve(deudas, 1000, 24, "InteresDescendente", "2026-01");

    const prioridad1 = resultado.ordenPago.find((d) => d.prioridad === 1);
    expect(prioridad1?.deudaId).toBe("altaTasa");
  });

  it("con presupuesto suficiente, el dinero extra va a la deuda prioritaria", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "prioritaria", nombre: "Prioritaria", saldoActual: 200, pagoMinimoMensual: 20, tasaInteresAnual: 0 }),
      makeDeuda({ id: "otra", nombre: "Otra", saldoActual: 5000, pagoMinimoMensual: 50, tasaInteresAnual: 0 }),
    ];

    // Presupuesto = 70 (mínimos) + 500 extra
    const resultado = simularBolaDeNieve(deudas, 570, 24, "SaldoAscendente", "2026-01");

    const primerMes = resultado.calendario[0];
    const pagoPrioritaria = primerMes.pagos.find((p) => p.deudaId === "prioritaria");
    // 200 de saldo + 20 minimo ya la cubre, el resto del extra (500-180=320 sobrante tras pagarla)
    // debe quedar pagada en el primer mes
    expect(pagoPrioritaria?.pagada).toBe(true);
    expect(pagoPrioritaria?.pagoTotal).toBeCloseTo(200, 2);
  });

  it("con presupuesto insuficiente (menor a la suma de mínimos), prorratea y nunca excede el presupuesto", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "d1", nombre: "D1", saldoActual: 10000, pagoMinimoMensual: 300, tasaInteresAnual: 12 }),
      makeDeuda({ id: "d2", nombre: "D2", saldoActual: 10000, pagoMinimoMensual: 200, tasaInteresAnual: 12 }),
    ];
    const presupuesto = 100; // suma de minimos = 500, presupuesto muy inferior

    const resultado = simularBolaDeNieve(deudas, presupuesto, 3, "SaldoAscendente", "2026-01");

    const primerMes = resultado.calendario[0];
    const totalGastado = primerMes.pagos.reduce((s, p) => s + p.pagoTotal, 0);

    expect(totalGastado).toBeLessThanOrEqual(presupuesto + 1e-9);

    // Prorrateo proporcional: d1 tenia el doble de pago minimo que d2, debe recibir el doble
    const pagoD1 = primerMes.pagos.find((p) => p.deudaId === "d1")?.pagoTotal ?? 0;
    const pagoD2 = primerMes.pagos.find((p) => p.deudaId === "d2")?.pagoTotal ?? 0;
    expect(pagoD1).toBeCloseTo(pagoD2 * 1.5, 1); // 300/(300+200)=0.6 -> 60, 200/500=0.4 -> 40, ratio 1.5
  });

  it("maneja una deuda con tasa de interés 0% sin agregar intereses", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "sinInteres", nombre: "SinInteres", saldoActual: 1000, pagoMinimoMensual: 100, tasaInteresAnual: 0 }),
    ];

    const resultado = simularBolaDeNieve(deudas, 100, 12, "SaldoAscendente", "2026-01");

    expect(resultado.totalInteresesPagados).toBe(0);
  });

  it("no crashea con un arreglo de deudas activas vacío, y no produce -Infinity ni fechas corruptas", () => {
    const resultado = simularBolaDeNieve([], 500, 12, "SaldoAscendente", "2026-01");

    expect(resultado.ordenPago).toEqual([]);
    expect(resultado.calendario).toEqual([]);
    expect(resultado.mesLibreDeDeudas).toBeNull();
    expect(resultado.fechaLibreDeDeudas).toBeNull();
    expect(resultado.mesesSimulados).toBe(0);
    expect(resultado.totalInteresesPagados).toBe(0);
  });

  it("también evita crash cuando todas las deudas están inactivas o con saldo 0", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "inactiva", activa: false, saldoActual: 500 }),
      makeDeuda({ id: "pagada", activa: true, saldoActual: 0 }),
    ];

    const resultado = simularBolaDeNieve(deudas, 500, 12, "SaldoAscendente", "2026-01");

    expect(resultado.mesLibreDeDeudas).not.toBe(-Infinity);
    expect(resultado.calendario).toEqual([]);
  });

  it("marca una deuda como pagada cuando su saldo llega a ~0", () => {
    const deudas: Deuda[] = [
      makeDeuda({ id: "d1", nombre: "D1", saldoActual: 100, pagoMinimoMensual: 100, tasaInteresAnual: 0 }),
    ];

    const resultado = simularBolaDeNieve(deudas, 100, 12, "SaldoAscendente", "2026-01");

    const resumen = resultado.ordenPago.find((d) => d.deudaId === "d1");
    expect(resumen?.mesEstimadoPago).toBe(1);
    expect(resultado.mesLibreDeDeudas).toBe(1);
    expect(resultado.calendario[0].pagos[0].pagada).toBe(true);
    expect(resultado.calendario[0].pagos[0].saldoFinal).toBe(0);
  });
});
