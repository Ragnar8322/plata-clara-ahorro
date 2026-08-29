import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useFinancialData } from "./useFinancialData";
import { Configuracion, Gasto } from "@/types";

// --- Mocks -----------------------------------------------------------------

// useAuth is mocked directly (instead of rendering a real AuthProvider) so the
// hook believes a user is authenticated without pulling in Supabase.
const mockUser = { id: "user-1" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/services/storage", () => ({
  loadGastos: vi.fn(),
  saveGasto: vi.fn(),
  updateGasto: vi.fn(),
  deleteGasto: vi.fn(),
  loadDeudas: vi.fn(),
  saveDeuda: vi.fn(),
  updateDeuda: vi.fn(),
  deleteDeuda: vi.fn(),
  loadConfiguracion: vi.fn(),
  saveConfiguracion: vi.fn(),
  loadCategorias: vi.fn(),
  saveCategoria: vi.fn(),
  updateCategoria: vi.fn(),
  deleteCategoria: vi.fn(),
  loadPagosDeuda: vi.fn(),
  savePagoDeuda: vi.fn(),
  updatePagoDeuda: vi.fn(),
  deletePagoDeuda: vi.fn(),
  loadPresupuestos: vi.fn(),
  savePresupuesto: vi.fn(),
  deletePresupuesto: vi.fn(),
  loadIngresos: vi.fn(),
  saveIngreso: vi.fn(),
  updateIngreso: vi.fn(),
  deleteIngreso: vi.fn(),
}));

vi.mock("@/services/metasStorage", () => ({
  loadMetas: vi.fn(),
  saveMeta: vi.fn(),
  updateMeta: vi.fn(),
  deleteMeta: vi.fn(),
}));

import * as storage from "@/services/storage";
import * as metasStorage from "@/services/metasStorage";

const defaultConfig: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

const realConfig: Configuracion = {
  ...defaultConfig,
  id: "config-1",
  ingresoMensualNeto: 3_000_000,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

// Resolves every load* query with an empty/default value so tests only need
// to override what they actually care about.
function mockAllQueriesResolved(overrides: { config?: Configuracion } = {}) {
  vi.mocked(storage.loadGastos).mockResolvedValue([]);
  vi.mocked(storage.loadDeudas).mockResolvedValue([]);
  vi.mocked(storage.loadConfiguracion).mockResolvedValue(overrides.config ?? defaultConfig);
  vi.mocked(storage.loadCategorias).mockResolvedValue([]);
  vi.mocked(storage.loadPagosDeuda).mockResolvedValue([]);
  vi.mocked(storage.loadPresupuestos).mockResolvedValue([]);
  vi.mocked(storage.loadIngresos).mockResolvedValue([]);
  vi.mocked(metasStorage.loadMetas).mockResolvedValue([]);
}

describe("useFinancialData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading=true and flips to false once every query resolves", async () => {
    mockAllQueriesResolved();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useFinancialData(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.gastos).toEqual([]);
    expect(result.current.deudas).toEqual([]);
    expect(result.current.metas).toEqual([]);
  });

  it("keeps loading=true if even a single query is still pending", async () => {
    // Every query resolves except loadIngresos, which never settles.
    vi.mocked(storage.loadGastos).mockResolvedValue([]);
    vi.mocked(storage.loadDeudas).mockResolvedValue([]);
    vi.mocked(storage.loadConfiguracion).mockResolvedValue(defaultConfig);
    vi.mocked(storage.loadCategorias).mockResolvedValue([]);
    vi.mocked(storage.loadPagosDeuda).mockResolvedValue([]);
    vi.mocked(storage.loadPresupuestos).mockResolvedValue([]);
    vi.mocked(storage.loadIngresos).mockImplementation(() => new Promise(() => {}));
    vi.mocked(metasStorage.loadMetas).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFinancialData(), { wrapper });

    // Give the resolved queries a chance to settle; loading must remain true
    // because loadIngresos never resolves.
    await waitFor(() => expect(result.current.gastos).toEqual([]));
    expect(result.current.loading).toBe(true);
  });

  it("reports configLoaded=false with the default config and true once a real config loads", async () => {
    mockAllQueriesResolved({ config: defaultConfig });
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(() => useFinancialData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config.id).toBe("default");
    expect(result.current.configLoaded).toBe(false);

    // Now simulate a real config being returned.
    vi.mocked(storage.loadConfiguracion).mockResolvedValue(realConfig);
    const { wrapper: wrapper2 } = createWrapper();
    const { result: result2 } = renderHook(() => useFinancialData(), { wrapper: wrapper2 });

    await waitFor(() => expect(result2.current.loading).toBe(false));
    expect(result2.current.config.id).toBe("config-1");
    expect(result2.current.configLoaded).toBe(true);

    rerender();
  });

  it("invalidates the gastos query for the current user after addGasto succeeds", async () => {
    mockAllQueriesResolved();
    const nuevoGasto: Gasto = {
      id: "gasto-1",
      descripcion: "Mercado",
      monto: 50_000,
      categoria: "Alimentación",
      fecha: "2026-08-29",
      metodoPago: "Efectivo",
    } as Gasto;
    vi.mocked(storage.saveGasto).mockResolvedValue(nuevoGasto);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useFinancialData(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.addGasto({
      descripcion: "Mercado",
      monto: 50_000,
      categoria: "Alimentación",
      fecha: "2026-08-29",
      metodoPago: "Efectivo",
    } as Omit<Gasto, "id">);

    expect(storage.saveGasto).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: "Mercado" }),
      mockUser.id,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["gastos", mockUser.id] });
  });
});
