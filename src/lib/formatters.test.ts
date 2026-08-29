import { describe, it, expect } from "vitest";
import { formatMoney } from "./formatters";
import { Configuracion } from "@/types";

function makeConfig(overrides: Partial<Configuracion> = {}): Configuracion {
  return {
    id: "config-1",
    ingresoMensualNeto: 0,
    monedaSimbolo: "$",
    nombreMoneda: "COP",
    presupuestoMensualParaDeudas: 0,
    mesesMaxProyeccion: 24,
    estrategiaOrdenDeudas: "SaldoAscendente",
    ...overrides,
  };
}

describe("formatMoney", () => {
  it("formatea un monto entero con el símbolo de la moneda", () => {
    const resultado = formatMoney(1000000, makeConfig());
    expect(resultado).toBe("$ 1.000.000");
  });

  it("redondea un monto con decimales a 0 decimales", () => {
    const resultado = formatMoney(1500.75, makeConfig());
    expect(resultado).toBe("$ 1.501");
  });

  it("formatea un monto de 0", () => {
    const resultado = formatMoney(0, makeConfig());
    expect(resultado).toBe("$ 0");
  });

  it("formatea un monto negativo", () => {
    const resultado = formatMoney(-5000, makeConfig());
    expect(resultado).toBe("$ -5.000");
  });

  it("usa el símbolo configurado en lugar de uno fijo", () => {
    const resultado = formatMoney(2000, makeConfig({ monedaSimbolo: "USD" }));
    expect(resultado).toBe("USD 2.000");
  });
});
