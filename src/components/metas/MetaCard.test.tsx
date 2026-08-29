import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import MetaCard from "./MetaCard";
import { MetaAhorro, Configuracion } from "@/types";

const mockConfig: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

// MetaCard reads `config` straight from useFinancialData(), which in turn
// depends on AuthContext + Supabase + React Query. None of that is relevant
// to MetaCard's own conditional logic, so the hook is mocked directly.
vi.mock("@/hooks/useFinancialData", () => ({
  useFinancialData: () => ({ config: mockConfig }),
}));

function makeMeta(overrides: Partial<MetaAhorro> = {}): MetaAhorro {
  return {
    id: "meta-1",
    nombre: "Vacaciones",
    emoji: "🏖️",
    monto_objetivo: 1_000_000,
    monto_actual: 200_000,
    aporte_mensual_planeado: 100_000,
    fecha_objetivo: undefined,
    activa: true,
    color: "#4f46e5",
    ...overrides,
  };
}

describe("MetaCard", () => {
  let onUpdate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdate = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
  });

  it("marks the goal as completed when monto_actual >= monto_objetivo", () => {
    const meta = makeMeta({ monto_actual: 1_000_000, monto_objetivo: 1_000_000 });
    render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />);

    expect(screen.getByText(/¡Meta alcanzada!/i)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Completada/i });
    expect(button).toBeDisabled();
  });

  it("also marks completed when monto_actual exceeds monto_objetivo", () => {
    const meta = makeMeta({ monto_actual: 1_200_000, monto_objetivo: 1_000_000 });
    render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />);

    expect(screen.getByText(/¡Meta alcanzada!/i)).toBeInTheDocument();
  });

  it("does not crash or divide by zero when aporte_mensual_planeado is 0 and shows 'Sin fecha límite'", () => {
    const meta = makeMeta({
      monto_actual: 200_000,
      monto_objetivo: 1_000_000,
      aporte_mensual_planeado: 0,
      fecha_objetivo: undefined,
    });

    expect(() =>
      render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />),
    ).not.toThrow();

    expect(screen.getByText("Sin fecha límite")).toBeInTheDocument();
    // The monthly-contribution badge should not render when there's no planned contribution
    expect(screen.queryByText(/\/mes/)).not.toBeInTheDocument();
  });

  it("falls back to the raw fecha_objetivo when aporte_mensual_planeado is 0 but a target date exists", () => {
    const meta = makeMeta({
      aporte_mensual_planeado: 0,
      fecha_objetivo: "2027-01-15",
    });
    render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />);

    expect(screen.getByText("Para: 2027-01-15")).toBeInTheDocument();
  });

  it("shows an estimated date computed from aporte_mensual_planeado when it is greater than 0", () => {
    const meta = makeMeta({
      monto_actual: 200_000,
      monto_objetivo: 1_000_000,
      aporte_mensual_planeado: 100_000,
      fecha_objetivo: undefined,
    });
    render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />);

    // falta = 800_000, mesesRestantes = ceil(800_000 / 100_000) = 8
    const expectedDate = addMonths(new Date(), 8);
    const expectedLabel = `Est. ${format(expectedDate, "MMM yyyy", { locale: es })}`;
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("renders the aporte action and lets the user submit a contribution via AporteDialog", async () => {
    const meta = makeMeta({
      monto_actual: 200_000,
      monto_objetivo: 1_000_000,
      aporte_mensual_planeado: 100_000,
    });

    expect(() =>
      render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />),
    ).not.toThrow();

    const openButton = screen.getByRole("button", { name: /Registrar Aporte/i });
    fireEvent.click(openButton);

    // AporteDialog is now rendered in a portal; its dialog title is an <h2>,
    // distinct from the trigger button which shares the same visible text.
    expect(await screen.findByRole("heading", { name: /Registrar Aporte/i })).toBeInTheDocument();
    const montoInput = screen.getByLabelText(/Monto/i);
    fireEvent.change(montoInput, { target: { value: "50000" } });

    const submitButton = screen.getByRole("button", { name: /Guardar Aporte/i });
    fireEvent.click(submitButton);

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        monto_actual: 250_000,
        activa: true, // 250_000 < 1_000_000 objetivo, so goal remains active
      }),
    );
  });

  it("marks the meta as inactive once the contribution completes it", async () => {
    const meta = makeMeta({
      monto_actual: 950_000,
      monto_objetivo: 1_000_000,
      aporte_mensual_planeado: 100_000,
    });

    render(<MetaCard meta={meta} onUpdate={onUpdate} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: /Registrar Aporte/i }));

    const montoInput = await screen.findByLabelText(/Monto/i);
    fireEvent.change(montoInput, { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar Aporte/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        monto_actual: 1_050_000,
        activa: false,
      }),
    );
  });
});
