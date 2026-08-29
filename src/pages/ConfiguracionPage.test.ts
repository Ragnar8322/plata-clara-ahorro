import { describe, it, expect } from "vitest";
import { configSchema } from "./ConfiguracionPage";

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    ingresoMensualNeto: 2000000,
    monedaSimbolo: "$",
    nombreMoneda: "COP",
    presupuestoMensualParaDeudas: 500000,
    mesesMaxProyeccion: 24,
    estrategiaOrdenDeudas: "SaldoAscendente",
    ...overrides,
  };
}

describe("configSchema", () => {
  it("acepta un caso válido", () => {
    const resultado = configSchema.safeParse(makeConfig());
    expect(resultado.success).toBe(true);
  });

  it("rechaza mesesMaxProyeccion menor a 1", () => {
    const resultado = configSchema.safeParse(makeConfig({ mesesMaxProyeccion: 0 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza mesesMaxProyeccion mayor a 120", () => {
    const resultado = configSchema.safeParse(makeConfig({ mesesMaxProyeccion: 121 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza estrategiaOrdenDeudas con un valor fuera del enum", () => {
    const resultado = configSchema.safeParse(makeConfig({ estrategiaOrdenDeudas: "Aleatorio" }));
    expect(resultado.success).toBe(false);
  });
});
