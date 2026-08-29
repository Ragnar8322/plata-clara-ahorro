import { describe, it, expect } from "vitest";
import { calculateHealthScore } from "./financialMetrics";
import { Ingreso, Deuda, MetaAhorro, Gasto } from "@/types";

function makeIngreso(overrides: Partial<Ingreso> = {}): Ingreso {
  return {
    id: "ing-1",
    nombre: "Salario",
    monto: 1000000,
    ...overrides,
  };
}

function makeDeuda(overrides: Partial<Deuda> = {}): Deuda {
  return {
    id: "deuda-1",
    nombre: "Deuda",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1000,
    saldoActual: 1000,
    tasaInteresAnual: 0,
    pagoMinimoMensual: 0,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
    ...overrides,
  };
}

function makeMeta(overrides: Partial<MetaAhorro> = {}): MetaAhorro {
  return {
    id: "meta-1",
    nombre: "Meta",
    emoji: "🎯",
    monto_objetivo: 1000,
    monto_actual: 0,
    aporte_mensual_planeado: 0,
    activa: true,
    color: "#000000",
    ...overrides,
  };
}

function makeGasto(overrides: Partial<Gasto> = {}): Gasto {
  return {
    id: "gasto-1",
    fecha: "2026-08-01",
    categoria: "Otros",
    descripcion: "Gasto",
    monto: 0,
    metodoPago: "Efectivo",
    tipo: "Variable",
    frecuencia: "Único",
    ...overrides,
  };
}

const MES_KEY = "2026-08";

describe("calculateHealthScore", () => {
  it("calcula el score usando la tabla de ingresos[] cuando no está vacía", () => {
    const score = calculateHealthScore(
      [makeIngreso({ monto: 2000000 })],
      [],
      [],
      [],
      MES_KEY,
      0
    );

    // Sin deudas (ratioDeuda=0 -> 30pts), sin gastos (ratioAhorro=1 -> 30pts), sin metas (15pts neutral)
    expect(score).toBe(75);
  });

  it("usa el fallback ingresoMensualNeto cuando ingresos[] está vacío y da un score razonable", () => {
    const score = calculateHealthScore(
      [],
      [makeDeuda({ activa: true, pagoMinimoMensual: 200000 })],
      [],
      [],
      MES_KEY,
      2000000
    );

    // ratioDeuda = 200000/2000000 = 0.1 <= 0.15 -> 30pts
    // margen = 2000000 - 0 - 200000 = 1800000; ratioAhorro = 0.9 >= 0.2 -> 30pts
    // sin metas -> 15pts neutral
    expect(score).toBe(75);
    expect(score).toBeGreaterThan(50);
  });

  it("sin metas activas, el score máximo posible es 75 (no 100)", () => {
    const score = calculateHealthScore(
      [makeIngreso({ monto: 1000000 })],
      [],
      [],
      [],
      MES_KEY,
      0
    );

    expect(score).toBe(75);
    expect(score).not.toBe(100);
  });

  it("con metas activas con progreso >= 50%, sube el componente de metas del score", () => {
    const base = [makeIngreso({ monto: 1000000 })];

    const scoreSinMetas = calculateHealthScore(base, [], [], [], MES_KEY, 0);

    const scoreProgresoBajo = calculateHealthScore(
      base,
      [],
      [makeMeta({ activa: true, monto_actual: 100, monto_objetivo: 1000 })], // 10%
      [],
      MES_KEY,
      0
    );

    const scoreProgresoAlto = calculateHealthScore(
      base,
      [],
      [makeMeta({ activa: true, monto_actual: 600, monto_objetivo: 1000 })], // 60% >= 50%
      [],
      MES_KEY,
      0
    );

    expect(scoreProgresoAlto).toBe(100); // 30 + 30 + 40
    expect(scoreProgresoAlto).toBeGreaterThan(scoreProgresoBajo);
    expect(scoreProgresoBajo).toBeGreaterThan(scoreSinMetas);
  });

  it("no produce NaN cuando una meta tiene monto_actual/monto_objetivo null o undefined", () => {
    const metaConNulls = makeMeta({
      activa: true,
      monto_actual: null as unknown as number,
      monto_objetivo: undefined as unknown as number,
    });

    const score = calculateHealthScore(
      [makeIngreso({ monto: 1000000 })],
      [],
      [metaConNulls],
      [],
      MES_KEY,
      0
    );

    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("no produce NaN ni valores fuera de rango con gastos filtrados por mesKey", () => {
    const score = calculateHealthScore(
      [makeIngreso({ monto: 1000000 })],
      [makeDeuda({ activa: true, pagoMinimoMensual: 100000 })],
      [makeMeta({ activa: true, monto_actual: 500, monto_objetivo: 1000 })],
      [
        makeGasto({ fecha: "2026-08-15", monto: 200000 }),
        makeGasto({ fecha: "2026-07-15", monto: 999999 }), // otro mes, no debe contar
      ],
      MES_KEY,
      0
    );

    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
