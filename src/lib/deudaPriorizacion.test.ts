import { describe, it, expect } from "vitest";
import { recomendarProximaDeuda, compararPorEstrategia } from "./deudaPriorizacion";
import { Deuda, PagoDeuda } from "@/types";

function makeDeuda(overrides: Partial<Deuda> = {}): Deuda {
  return {
    id: overrides.id ?? "d1",
    nombre: overrides.nombre ?? "Deuda",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1_000_000,
    saldoActual: 500_000,
    tasaInteresAnual: 20,
    pagoMinimoMensual: 50_000,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
    ...overrides,
  };
}

describe("compararPorEstrategia", () => {
  it("orders by ascending saldo under SaldoAscendente", () => {
    const a = { saldo: 200, tasaAnual: 10 };
    const b = { saldo: 100, tasaAnual: 30 };
    expect(compararPorEstrategia(a, b, "SaldoAscendente")).toBeGreaterThan(0);
  });

  it("orders by descending tasaAnual under InteresDescendente", () => {
    const a = { saldo: 200, tasaAnual: 10 };
    const b = { saldo: 100, tasaAnual: 30 };
    expect(compararPorEstrategia(a, b, "InteresDescendente")).toBeGreaterThan(0);
  });
});

describe("recomendarProximaDeuda", () => {
  it("returns null when there are no active deudas with a balance", () => {
    const deudas = [makeDeuda({ activa: false }), makeDeuda({ id: "d2", saldoActual: 0 })];
    expect(recomendarProximaDeuda(deudas, [], "SaldoAscendente")).toBeNull();
  });

  it("prioritizes the deuda most overdue, even if the strategy would pick a different one", () => {
    const hoy = new Date(2026, 2, 25); // 25 marzo 2026
    const deudas = [
      makeDeuda({ id: "grande", nombre: "Grande", saldoActual: 5_000_000, diaCorteOPago: 1 }), // no en mora aún (corte 1, sin pago desde 1 marzo -> en mora tambien, ajustar)
      makeDeuda({ id: "pequena", nombre: "Pequeña", saldoActual: 100_000, diaCorteOPago: 15 }), // corte 15 marzo, hoy 25 -> en mora 10 días
    ];
    // "Grande" corte día 1: corte vigente = 1 marzo, hoy 25 marzo -> 24 días de mora (más que "Pequeña").
    const resultado = recomendarProximaDeuda(deudas, [], "SaldoAscendente", hoy);
    expect(resultado?.deuda.id).toBe("grande");
    expect(resultado?.diasMora).toBe(24);
    expect(resultado?.razon).toContain("mora");
  });

  it("breaks a mora tie using the configured strategy", () => {
    const hoy = new Date(2026, 2, 25);
    // Ambas con el mismo corte (15), por lo que ambas tienen exactamente 10 días de mora.
    const deudas = [
      makeDeuda({ id: "alto-saldo", saldoActual: 5_000_000, tasaInteresAnual: 10, diaCorteOPago: 15 }),
      makeDeuda({ id: "bajo-saldo", saldoActual: 100_000, tasaInteresAnual: 10, diaCorteOPago: 15 }),
    ];
    const resultado = recomendarProximaDeuda(deudas, [], "SaldoAscendente", hoy);
    expect(resultado?.deuda.id).toBe("bajo-saldo");
    expect(resultado?.diasMora).toBe(10);
  });

  it("falls back to SaldoAscendente strategy when no deuda is in mora", () => {
    const hoy = new Date(2026, 2, 20);
    const pagos: PagoDeuda[] = [
      { id: "p1", deuda_id: "alto", monto: 1, fecha: "2026-03-16" },
      { id: "p2", deuda_id: "bajo", monto: 1, fecha: "2026-03-16" },
    ];
    const deudas = [
      makeDeuda({ id: "alto", saldoActual: 5_000_000, diaCorteOPago: 15 }),
      makeDeuda({ id: "bajo", saldoActual: 100_000, diaCorteOPago: 15 }),
    ];
    const resultado = recomendarProximaDeuda(deudas, pagos, "SaldoAscendente", hoy);
    expect(resultado?.deuda.id).toBe("bajo");
    expect(resultado?.diasMora).toBe(0);
    expect(resultado?.razon).toContain("bola de nieve");
  });

  it("falls back to InteresDescendente strategy when no deuda is in mora", () => {
    const hoy = new Date(2026, 2, 20);
    const pagos: PagoDeuda[] = [
      { id: "p1", deuda_id: "baja-tasa", monto: 1, fecha: "2026-03-16" },
      { id: "p2", deuda_id: "alta-tasa", monto: 1, fecha: "2026-03-16" },
    ];
    const deudas = [
      makeDeuda({ id: "baja-tasa", tasaInteresAnual: 10, diaCorteOPago: 15 }),
      makeDeuda({ id: "alta-tasa", tasaInteresAnual: 35, diaCorteOPago: 15 }),
    ];
    const resultado = recomendarProximaDeuda(deudas, pagos, "InteresDescendente", hoy);
    expect(resultado?.deuda.id).toBe("alta-tasa");
    expect(resultado?.razon).toContain("avalancha");
  });
});
