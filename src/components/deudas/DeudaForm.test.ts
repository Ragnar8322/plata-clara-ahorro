import { describe, it, expect } from "vitest";
import { deudaSchema } from "./DeudaForm";

function makeDeuda(overrides: Record<string, unknown> = {}) {
  return {
    nombre: "Tarjeta Banco X",
    tipo: "Tarjeta de crédito",
    entidad: "Banco X",
    saldoInicial: 1000,
    saldoActual: 800,
    tasaInteresAnual: 20,
    pagoMinimoMensual: 50,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
    notas: "",
    ...overrides,
  };
}

describe("deudaSchema", () => {
  it("acepta un caso válido", () => {
    const resultado = deudaSchema.safeParse(makeDeuda());
    expect(resultado.success).toBe(true);
  });

  it("rechaza saldoInicial negativo", () => {
    const resultado = deudaSchema.safeParse(makeDeuda({ saldoInicial: -100 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza saldoActual negativo", () => {
    const resultado = deudaSchema.safeParse(makeDeuda({ saldoActual: -1 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza pagoMinimoMensual negativo", () => {
    const resultado = deudaSchema.safeParse(makeDeuda({ pagoMinimoMensual: -50 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza día de corte fuera de rango (menor a 1)", () => {
    const resultado = deudaSchema.safeParse(makeDeuda({ diaCorteOPago: 0 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza día de corte fuera de rango (mayor a 31)", () => {
    const resultado = deudaSchema.safeParse(makeDeuda({ diaCorteOPago: 32 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando el saldo actual es mayor al saldo inicial", () => {
    const resultado = deudaSchema.safeParse(
      makeDeuda({ saldoInicial: 100, saldoActual: 200 })
    );
    expect(resultado.success).toBe(false);
  });
});
