import { describe, it, expect, vi, beforeEach } from "vitest";

// Same chainable-builder mocking strategy as storage.test.ts: the Supabase
// client module is stubbed, and .from() returns a fake fluent query builder
// whose terminal `await` resolves to a pre-configured { data, error }.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from "@/integrations/supabase/client";
import { loadMetas, saveMeta, updateMeta, deleteMeta } from "./metasStorage";
import { MetaAhorro } from "@/types";

type Result = { data: unknown; error: unknown };

function createBuilder(result: Result) {
  const builder: Record<string, unknown> = {};
  const chainMethods = ["select", "insert", "update", "delete", "eq", "order", "single"];
  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }
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

describe("metasStorage.ts — loadMetas", () => {
  it("queries the 'metas_ahorro' table ordered by created_at and returns rows as-is (no camelCase mapping)", async () => {
    const rows: MetaAhorro[] = [
      {
        id: "m1",
        nombre: "Vacaciones",
        emoji: "🏖️",
        monto_objetivo: 1_000_000,
        monto_actual: 200_000,
        aporte_mensual_planeado: 100_000,
        activa: true,
        color: "#4f46e5",
      },
    ];
    const builder = mockFrom({ data: rows, error: null });

    const result = await loadMetas();

    expect(supabase.from).toHaveBeenCalledWith("metas_ahorro");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: true });
    // No field remapping happens for metas: the DB row shape already matches
    // MetaAhorro (snake_case fields both in TS and in SQL), unlike
    // storage.ts's Gasto/Deuda which translate camelCase <-> snake_case.
    expect(result).toBe(rows);
  });

  it("returns an empty array (not null) when data is null and there is no error", async () => {
    mockFrom({ data: null, error: null });
    const result = await loadMetas();
    expect(result).toEqual([]);
  });

  it("swallows a '42P01' (undefined table) error and returns an empty array instead of throwing", async () => {
    mockFrom({ data: null, error: { code: "42P01", message: "relation does not exist" } });
    const result = await loadMetas();
    expect(result).toEqual([]);
  });

  it("throws any other Supabase error", async () => {
    mockFrom({ data: null, error: { code: "42501", message: "permission denied" } });
    await expect(loadMetas()).rejects.toEqual({ code: "42501", message: "permission denied" });
  });
});

describe("metasStorage.ts — saveMeta", () => {
  it("inserts the meta merged with user_id and returns the inserted row as-is", async () => {
    const newMeta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at"> = {
      nombre: "Carro nuevo",
      emoji: "🚗",
      monto_objetivo: 20_000_000,
      monto_actual: 0,
      aporte_mensual_planeado: 500_000,
      activa: true,
      color: "#f59e0b",
    };
    const insertedRow: MetaAhorro = { ...newMeta, id: "m2", user_id: "user-1" };
    const builder = mockFrom({ data: insertedRow, error: null });

    const result = await saveMeta(newMeta, "user-1");

    expect(supabase.from).toHaveBeenCalledWith("metas_ahorro");
    expect(builder.insert).toHaveBeenCalledWith([{ ...newMeta, fecha_objetivo: null, user_id: "user-1" }]);
    expect(result).toBe(insertedRow);
  });

  it("coerces an empty fecha_objetivo string to null instead of sending it to Postgres", async () => {
    const newMeta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at"> = {
      nombre: "Viaje",
      emoji: "✈️",
      monto_objetivo: 5_000_000,
      monto_actual: 0,
      aporte_mensual_planeado: 200_000,
      activa: true,
      color: "#2563eb",
      fecha_objetivo: "",
    };
    const insertedRow: MetaAhorro = { ...newMeta, id: "m3", user_id: "user-1", fecha_objetivo: null };
    const builder = mockFrom({ data: insertedRow, error: null });

    await saveMeta(newMeta, "user-1");

    expect(builder.insert).toHaveBeenCalledWith([{ ...newMeta, fecha_objetivo: null, user_id: "user-1" }]);
  });

  it("throws when Supabase returns an error on insert", async () => {
    mockFrom({ data: null, error: { message: "insert failed" } });
    await expect(
      saveMeta(
        {
          nombre: "Carro nuevo",
          emoji: "🚗",
          monto_objetivo: 20_000_000,
          monto_actual: 0,
          aporte_mensual_planeado: 500_000,
          activa: true,
          color: "#f59e0b",
        },
        "user-1",
      ),
    ).rejects.toEqual({ message: "insert failed" });
  });
});

describe("metasStorage.ts — updateMeta", () => {
  it("sends only the editable fields plus a fresh updated_at timestamp, filtered by id", async () => {
    const meta: MetaAhorro = {
      id: "m1",
      user_id: "user-1",
      nombre: "Vacaciones",
      emoji: "🏖️",
      monto_objetivo: 1_000_000,
      monto_actual: 300_000,
      aporte_mensual_planeado: 100_000,
      fecha_objetivo: "2027-01-01",
      activa: true,
      color: "#4f46e5",
      notas: "para diciembre",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const updatedRow = { ...meta, monto_actual: 300_000 };
    const builder = mockFrom({ data: updatedRow, error: null });

    const before = Date.now();
    const result = await updateMeta(meta);
    const after = Date.now();

    expect(builder.eq).toHaveBeenCalledWith("id", "m1");
    expect(builder.update).toHaveBeenCalledTimes(1);
    const payload = builder.update.mock.calls[0][0] as Record<string, unknown>;

    // user_id, created_at and id are intentionally NOT part of the update
    // payload (they're immutable / handled via .eq()).
    expect(payload).toEqual({
      nombre: "Vacaciones",
      emoji: "🏖️",
      monto_objetivo: 1_000_000,
      monto_actual: 300_000,
      aporte_mensual_planeado: 100_000,
      fecha_objetivo: "2027-01-01",
      activa: true,
      color: "#4f46e5",
      notas: "para diciembre",
      updated_at: payload.updated_at,
    });
    const updatedAtMs = new Date(payload.updated_at as string).getTime();
    expect(updatedAtMs).toBeGreaterThanOrEqual(before);
    expect(updatedAtMs).toBeLessThanOrEqual(after);
    expect(result).toBe(updatedRow);
  });

  it("throws when Supabase returns an error on update", async () => {
    mockFrom({ data: null, error: { message: "update failed" } });
    await expect(
      updateMeta({
        id: "m1",
        nombre: "Vacaciones",
        emoji: "🏖️",
        monto_objetivo: 1_000_000,
        monto_actual: 300_000,
        aporte_mensual_planeado: 100_000,
        activa: true,
        color: "#4f46e5",
      }),
    ).rejects.toEqual({ message: "update failed" });
  });
});

describe("metasStorage.ts — deleteMeta", () => {
  it("deletes by id from 'metas_ahorro'", async () => {
    const builder = mockFrom({ data: null, error: null });
    await expect(deleteMeta("m1")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("metas_ahorro");
    expect(builder.eq).toHaveBeenCalledWith("id", "m1");
  });

  it("throws when Supabase returns an error on delete", async () => {
    mockFrom({ data: null, error: { message: "delete failed" } });
    await expect(deleteMeta("m1")).rejects.toEqual({ message: "delete failed" });
  });
});
