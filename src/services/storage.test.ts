import { describe, it, expect, vi, beforeEach } from "vitest";

// storage.ts is a thin CRUD layer over Supabase. We mock the Supabase client
// module itself with a fake chainable query builder (select/insert/update/
// delete/eq/order/upsert/single/maybeSingle all return `this`, and the
// builder is "thenable" so `await supabase.from(...).select(...)` resolves
// to whatever { data, error } the test configured).
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from "@/integrations/supabase/client";
import {
  loadGastos,
  saveGasto,
  updateGasto,
  deleteGasto,
  loadDeudas,
  saveDeuda,
  updateDeuda,
  loadConfiguracion,
  saveConfiguracion,
} from "./storage";
import { Gasto, Deuda, Configuracion } from "@/types";

type Result = { data: unknown; error: unknown };

function createBuilder(result: Result) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "order",
    "single",
    "maybeSingle",
  ];
  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }
  // Make the builder awaitable directly (used by loadGastos/loadDeudas which
  // never call .single()/.maybeSingle() before being awaited).
  builder.then = (
    resolve: (value: Result) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder as Record<string, ReturnType<typeof vi.fn>> & PromiseLike<Result>;
}

function mockFrom(result: Result) {
  const builder = createBuilder(result);
  (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);
  return builder;
}

beforeEach(() => {
  vi.mocked(supabase.from).mockReset();
});

describe("storage.ts — Gastos", () => {
  it("loadGastos queries the 'gastos' table and maps snake_case rows to the camelCase Gasto shape", async () => {
    const row = {
      id: "g1",
      fecha: "2026-01-15",
      categoria: "Alimentación",
      descripcion: "Mercado",
      monto: "150000.50",
      metodo_pago: "Efectivo",
      tipo: "Variable",
      frecuencia: "Único",
      notas: null,
    };
    const builder = mockFrom({ data: [row], error: null });

    const result = await loadGastos();

    expect(supabase.from).toHaveBeenCalledWith("gastos");
    expect(builder.order).toHaveBeenCalledWith("fecha", { ascending: false });
    expect(result).toEqual([
      {
        id: "g1",
        fecha: "2026-01-15",
        categoria: "Alimentación",
        descripcion: "Mercado",
        monto: 150000.5, // string coerced to number
        metodoPago: "Efectivo",
        tipo: "Variable",
        frecuencia: "Único",
        notas: undefined, // null -> undefined
      },
    ]);
  });

  it("loadGastos returns an empty array when data is null", async () => {
    mockFrom({ data: null, error: null });
    const result = await loadGastos();
    expect(result).toEqual([]);
  });

  it("loadGastos throws the Supabase error instead of swallowing it", async () => {
    mockFrom({ data: null, error: new Error("connection failed") });
    await expect(loadGastos()).rejects.toThrow("connection failed");
  });

  it("saveGasto maps the camelCase Gasto fields to snake_case columns on insert", async () => {
    const inputGasto: Omit<Gasto, "id"> = {
      fecha: "2026-02-01",
      categoria: "Transporte",
      descripcion: "Uber",
      monto: 25000,
      metodoPago: "Tarjeta de crédito",
      tipo: "Variable",
      frecuencia: "Único",
      notas: undefined,
    };
    const insertedRow = {
      id: "g2",
      fecha: "2026-02-01",
      categoria: "Transporte",
      descripcion: "Uber",
      monto: "25000",
      metodo_pago: "Tarjeta de crédito",
      tipo: "Variable",
      frecuencia: "Único",
      notas: null,
    };
    const builder = mockFrom({ data: insertedRow, error: null });

    const result = await saveGasto(inputGasto, "user-1");

    expect(supabase.from).toHaveBeenCalledWith("gastos");
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      fecha: "2026-02-01",
      categoria: "Transporte",
      descripcion: "Uber",
      monto: 25000,
      metodo_pago: "Tarjeta de crédito",
      tipo: "Variable",
      frecuencia: "Único",
      notas: null, // undefined coerced to null on write
    });
    expect(result.metodoPago).toBe("Tarjeta de crédito");
    expect(result.monto).toBe(25000);
  });

  it("saveGasto throws when Supabase returns an error", async () => {
    mockFrom({ data: null, error: { message: "insert failed" } });
    await expect(
      saveGasto(
        {
          fecha: "2026-02-01",
          categoria: "Transporte",
          descripcion: "Uber",
          monto: 25000,
          metodoPago: "Efectivo",
          tipo: "Variable",
          frecuencia: "Único",
        },
        "user-1",
      ),
    ).rejects.toEqual({ message: "insert failed" });
  });

  it("updateGasto maps fields and filters by id, resolving to void on success", async () => {
    const builder = mockFrom({ data: null, error: null });
    const gasto: Gasto = {
      id: "g1",
      fecha: "2026-03-01",
      categoria: "Salud",
      descripcion: "Consulta",
      monto: 80000,
      metodoPago: "Débito",
      tipo: "Variable",
      frecuencia: "Único",
      notas: "urgencia",
    };

    await expect(updateGasto(gasto)).resolves.toBeUndefined();

    expect(builder.update).toHaveBeenCalledWith({
      fecha: "2026-03-01",
      categoria: "Salud",
      descripcion: "Consulta",
      monto: 80000,
      metodo_pago: "Débito",
      tipo: "Variable",
      frecuencia: "Único",
      notas: "urgencia",
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "g1");
  });

  it("deleteGasto deletes by id and throws on Supabase error", async () => {
    const builder = mockFrom({ data: null, error: null });
    await deleteGasto("g1");
    expect(supabase.from).toHaveBeenCalledWith("gastos");
    expect(builder.eq).toHaveBeenCalledWith("id", "g1");

    mockFrom({ data: null, error: { message: "delete failed" } });
    await expect(deleteGasto("g1")).rejects.toEqual({ message: "delete failed" });
  });
});

describe("storage.ts — Deudas", () => {
  it("loadDeudas maps snake_case numeric columns to camelCase numbers", async () => {
    const row = {
      id: "d1",
      nombre: "Visa",
      tipo: "Tarjeta de crédito",
      entidad: "Bancolombia",
      saldo_inicial: "1000000",
      saldo_actual: "600000",
      tasa_interes_anual: "28.5",
      pago_minimo_mensual: "50000",
      dia_corte_o_pago: 15,
      pago_extra_planeado_mensual: "0",
      activa: true,
      notas: null,
    };
    const builder = mockFrom({ data: [row], error: null });

    const result = await loadDeudas();

    expect(supabase.from).toHaveBeenCalledWith("deudas");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(result).toEqual([
      {
        id: "d1",
        nombre: "Visa",
        tipo: "Tarjeta de crédito",
        entidad: "Bancolombia",
        saldoInicial: 1000000,
        saldoActual: 600000,
        tasaInteresAnual: 28.5,
        pagoMinimoMensual: 50000,
        diaCorteOPago: 15,
        pagoExtraPlaneadoMensual: 0,
        activa: true,
        notas: undefined,
      },
    ]);
  });

  it("loadDeudas throws on Supabase error", async () => {
    mockFrom({ data: null, error: { message: "boom" } });
    await expect(loadDeudas()).rejects.toEqual({ message: "boom" });
  });

  it("saveDeuda maps camelCase to snake_case columns on insert", async () => {
    const inputDeuda: Omit<Deuda, "id"> = {
      nombre: "Libranza",
      tipo: "Crédito personal",
      entidad: "Banco X",
      saldoInicial: 5000000,
      saldoActual: 5000000,
      tasaInteresAnual: 18,
      pagoMinimoMensual: 200000,
      diaCorteOPago: 5,
      pagoExtraPlaneadoMensual: 0,
      activa: true,
      notas: undefined,
    };
    const insertedRow = {
      id: "d2",
      nombre: "Libranza",
      tipo: "Crédito personal",
      entidad: "Banco X",
      saldo_inicial: "5000000",
      saldo_actual: "5000000",
      tasa_interes_anual: "18",
      pago_minimo_mensual: "200000",
      dia_corte_o_pago: 5,
      pago_extra_planeado_mensual: "0",
      activa: true,
      notas: null,
    };
    const builder = mockFrom({ data: insertedRow, error: null });

    const result = await saveDeuda(inputDeuda, "user-1");

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      nombre: "Libranza",
      tipo: "Crédito personal",
      entidad: "Banco X",
      saldo_inicial: 5000000,
      saldo_actual: 5000000,
      tasa_interes_anual: 18,
      pago_minimo_mensual: 200000,
      dia_corte_o_pago: 5,
      pago_extra_planeado_mensual: 0,
      activa: true,
      notas: null,
    });
    expect(result.saldoInicial).toBe(5000000);
    expect(result.id).toBe("d2");
  });

  it("updateDeuda maps fields and filters by id", async () => {
    const builder = mockFrom({ data: null, error: null });
    const deuda: Deuda = {
      id: "d1",
      nombre: "Visa",
      tipo: "Tarjeta de crédito",
      entidad: "Bancolombia",
      saldoInicial: 1000000,
      saldoActual: 500000,
      tasaInteresAnual: 28.5,
      pagoMinimoMensual: 50000,
      diaCorteOPago: 15,
      pagoExtraPlaneadoMensual: 20000,
      activa: true,
      notas: undefined,
    };

    await updateDeuda(deuda);

    expect(builder.update).toHaveBeenCalledWith({
      nombre: "Visa",
      tipo: "Tarjeta de crédito",
      entidad: "Bancolombia",
      saldo_inicial: 1000000,
      saldo_actual: 500000,
      tasa_interes_anual: 28.5,
      pago_minimo_mensual: 50000,
      dia_corte_o_pago: 15,
      pago_extra_planeado_mensual: 20000,
      activa: true,
      notas: null,
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "d1");
  });
});

describe("storage.ts — Configuración", () => {
  it("loadConfiguracion maps a found row from snake_case to camelCase", async () => {
    const row = {
      id: "cfg-1",
      ingreso_mensual_neto: "3000000",
      moneda_simbolo: "$",
      nombre_moneda: "COP",
      presupuesto_mensual_para_deudas: "500000",
      meses_max_proyeccion: 24,
      estrategia_orden_deudas: "InteresDescendente",
    };
    const builder = mockFrom({ data: row, error: null });

    const result = await loadConfiguracion();

    expect(supabase.from).toHaveBeenCalledWith("configuracion");
    expect(builder.maybeSingle).toHaveBeenCalled();
    expect(result).toEqual({
      id: "cfg-1",
      ingresoMensualNeto: 3000000,
      monedaSimbolo: "$",
      nombreMoneda: "COP",
      presupuestoMensualParaDeudas: 500000,
      mesesMaxProyeccion: 24,
      estrategiaOrdenDeudas: "InteresDescendente",
    });
  });

  it("loadConfiguracion falls back to the hard-coded default when no row exists yet", async () => {
    mockFrom({ data: null, error: null });

    const result = await loadConfiguracion();

    expect(result).toEqual({
      id: "default",
      ingresoMensualNeto: 0,
      monedaSimbolo: "$",
      nombreMoneda: "COP",
      presupuestoMensualParaDeudas: 0,
      mesesMaxProyeccion: 36,
      estrategiaOrdenDeudas: "SaldoAscendente",
    });
  });

  it("loadConfiguracion throws on Supabase error rather than falling back to defaults", async () => {
    mockFrom({ data: null, error: { message: "rls denied" } });
    await expect(loadConfiguracion()).rejects.toEqual({ message: "rls denied" });
  });

  it("saveConfiguracion upserts on user_id and maps camelCase to snake_case", async () => {
    const config: Configuracion = {
      id: "default",
      ingresoMensualNeto: 4000000,
      monedaSimbolo: "$",
      nombreMoneda: "COP",
      presupuestoMensualParaDeudas: 800000,
      mesesMaxProyeccion: 12,
      estrategiaOrdenDeudas: "SaldoAscendente",
    };
    const returnedRow = {
      id: "cfg-9",
      ingreso_mensual_neto: "4000000",
      moneda_simbolo: "$",
      nombre_moneda: "COP",
      presupuesto_mensual_para_deudas: "800000",
      meses_max_proyeccion: 12,
      estrategia_orden_deudas: "SaldoAscendente",
    };
    const builder = mockFrom({ data: returnedRow, error: null });

    const result = await saveConfiguracion(config, "user-1");

    // NOTE: when config.id === "default" the id is explicitly set to
    // `undefined` in the upsert payload (letting the DB generate one).
    expect(builder.upsert).toHaveBeenCalledWith(
      {
        id: undefined,
        user_id: "user-1",
        ingreso_mensual_neto: 4000000,
        moneda_simbolo: "$",
        nombre_moneda: "COP",
        presupuesto_mensual_para_deudas: 800000,
        meses_max_proyeccion: 12,
        estrategia_orden_deudas: "SaldoAscendente",
      },
      { onConflict: "user_id" },
    );
    expect(result.id).toBe("cfg-9");
  });

  it("saveConfiguracion throws on Supabase error", async () => {
    mockFrom({ data: null, error: { message: "upsert failed" } });
    await expect(
      saveConfiguracion(
        {
          id: "default",
          ingresoMensualNeto: 0,
          monedaSimbolo: "$",
          nombreMoneda: "COP",
          presupuestoMensualParaDeudas: 0,
          mesesMaxProyeccion: 36,
          estrategiaOrdenDeudas: "SaldoAscendente",
        },
        "user-1",
      ),
    ).rejects.toEqual({ message: "upsert failed" });
  });
});
