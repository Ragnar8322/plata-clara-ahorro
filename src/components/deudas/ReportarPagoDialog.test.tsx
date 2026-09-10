import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ReportarPagoDialog from "./ReportarPagoDialog";
import { Deuda } from "@/types";

function makeDeuda(overrides: Partial<Deuda>): Deuda {
  return {
    id: overrides.id ?? "id",
    nombre: "Deuda",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1_000_000,
    saldoActual: 500_000,
    tasaInteresAnual: 20,
    pagoMinimoMensual: 366_696,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 10_000,
    activa: true,
    ...overrides,
  };
}

describe("ReportarPagoDialog reset behavior (smoke)", () => {
  it("starts empty (no deuda, no monto) when opened without a preselected deuda, and the submit button is disabled", () => {
    const deudas = [makeDeuda({ id: "d1", nombre: "0 es 3" }), makeDeuda({ id: "d2", nombre: "Otra deuda" })];
    render(
      <ReportarPagoDialog open={true} onOpenChange={vi.fn()} deudas={deudas} onSubmit={vi.fn()} />
    );

    const dialog = screen.getByRole("dialog");
    // No deuda silently preselected: the combobox shows the placeholder, not "0 es 3".
    expect(within(dialog).getByRole("combobox")).toHaveTextContent("Seleccionar deuda...");
    // Monto starts empty, not pre-filled with any deuda's pagoMinimoMensual.
    expect(within(dialog).getByLabelText(/Monto pagado/i)).toHaveValue("");
    // Can't submit until a deuda is actually chosen.
    expect(within(dialog).getByRole("button", { name: /Registrar pago/i })).toBeDisabled();
  });

  it("still pre-fills deuda + pagoMinimoMensual when opened from a specific row (deudaPreseleccionada)", () => {
    const deuda = makeDeuda({ id: "d1", nombre: "Tarjeta Visa", pagoMinimoMensual: 50_000 });
    render(
      <ReportarPagoDialog open={true} onOpenChange={vi.fn()} deudas={[deuda]} deudaPreseleccionada={deuda} onSubmit={vi.fn()} />
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Monto pagado/i)).toHaveValue("50.000");
  });
});
