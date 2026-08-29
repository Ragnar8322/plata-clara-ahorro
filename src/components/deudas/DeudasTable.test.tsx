import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import DeudasTable from "./DeudasTable";
import { Deuda, PagoDeuda, Configuracion } from "@/types";
import { formatMoney } from "@/lib/formatters";

const config: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

function makeDeuda(overrides: Partial<Deuda>): Deuda {
  return {
    id: overrides.id ?? "id",
    nombre: "Deuda",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1_000_000,
    saldoActual: 500_000,
    tasaInteresAnual: 20,
    pagoMinimoMensual: 50_000,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 10_000,
    activa: true,
    ...overrides,
  };
}

function makePago(overrides: Partial<PagoDeuda>): PagoDeuda {
  return {
    id: overrides.id ?? "pago-id",
    deuda_id: overrides.deuda_id ?? "id",
    monto: 50_000,
    fecha: "2026-01-01",
    ...overrides,
  };
}

describe("DeudasTable", () => {
  it("only sums saldoActual/pagoMinimoMensual/pagoExtraPlaneadoMensual for deudas activas", () => {
    const deudas = [
      makeDeuda({ id: "1", nombre: "Activa 1", activa: true, saldoActual: 500_000, pagoMinimoMensual: 50_000, pagoExtraPlaneadoMensual: 10_000 }),
      makeDeuda({ id: "2", nombre: "Activa 2", activa: true, saldoActual: 300_000, pagoMinimoMensual: 30_000, pagoExtraPlaneadoMensual: 5_000 }),
      makeDeuda({ id: "3", nombre: "Inactiva", activa: false, saldoActual: 999_999, pagoMinimoMensual: 999_999, pagoExtraPlaneadoMensual: 999_999 }),
    ];
    render(<DeudasTable deudas={deudas} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // totalSaldo = 500_000 + 300_000 = 800_000 (inactive deuda's 999_999 excluded)
    expect(screen.getByText(formatMoney(800_000, config))).toBeInTheDocument();
    // totalMinimos = 50_000 + 30_000 = 80_000
    expect(screen.getByText(formatMoney(80_000, config))).toBeInTheDocument();
    // totalExtra = 10_000 + 5_000 = 15_000
    expect(screen.getByText(formatMoney(15_000, config))).toBeInTheDocument();

    // The inactive row is still listed in the table itself (not filtered out of the
    // list) — "Inactiva" appears both as its nombre and as its Estado badge text.
    expect(screen.getAllByText("Inactiva").length).toBeGreaterThan(0);
  });

  it("excludes an inactive deuda from totals even when it is the only debt with a balance", () => {
    const deudas = [
      makeDeuda({ id: "1", nombre: "Solo inactiva", activa: false, saldoActual: 700_000, pagoMinimoMensual: 70_000, pagoExtraPlaneadoMensual: 7_000 }),
    ];
    render(<DeudasTable deudas={deudas} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // All three totals should be zero since the only deuda present is inactive
    const zero = formatMoney(0, config);
    expect(screen.getAllByText(zero)).toHaveLength(3);
  });

  it("filters and sorts a selected deuda's pago history by date (most recent first)", () => {
    const deudas = [makeDeuda({ id: "d1", nombre: "Tarjeta Visa" }), makeDeuda({ id: "d2", nombre: "Tarjeta Master" })];
    const pagos = [
      makePago({ id: "p1", deuda_id: "d1", fecha: "2026-01-01", monto: 10_000 }),
      makePago({ id: "p2", deuda_id: "d2", fecha: "2026-06-01", monto: 999_000 }), // belongs to the other deuda
      makePago({ id: "p3", deuda_id: "d1", fecha: "2026-03-01", monto: 30_000 }),
      makePago({ id: "p4", deuda_id: "d1", fecha: "2026-02-01", monto: 20_000 }),
    ];
    render(
      <DeudasTable deudas={deudas} pagos={pagos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} onAddPago={vi.fn()} onDeletePago={vi.fn()} />,
    );

    // Open the "Ver historial" dialog for the first deuda (Tarjeta Visa / d1)
    const rows = screen.getAllByRole("row").slice(1);
    const visaRow = rows.find((r) => within(r).queryByText("Tarjeta Visa"))!;
    const historyButton = within(visaRow).getByTitle("Ver historial");
    fireEvent.click(historyButton);

    // Scope all assertions to the "Historial de Pagos" dialog to avoid colliding
    // with unrelated amounts elsewhere on the page (totals, other table cells).
    const dialog = screen.getByRole("dialog");
    within(dialog).getByText("Historial de Pagos");

    // Only d1's payments should appear, ordered descending by fecha: p3 (03-01), p4 (02-01), p1 (01-01)
    expect(within(dialog).getByText(formatMoney(30_000, config))).toBeInTheDocument();
    expect(within(dialog).getByText(formatMoney(20_000, config))).toBeInTheDocument();
    expect(within(dialog).getByText(formatMoney(10_000, config))).toBeInTheDocument();
    // The other deuda's payment must not leak into this history
    expect(within(dialog).queryByText(formatMoney(999_000, config))).not.toBeInTheDocument();

    // Verify ordering: each payment row's bold amount <span> reflects descending date order
    const dialogAmounts = [formatMoney(30_000, config), formatMoney(20_000, config), formatMoney(10_000, config)];
    const allBoldAmounts = within(dialog)
      .getAllByText((_, el) => el?.tagName === "SPAN" && el.className.includes("font-semibold"))
      .map((el) => el.textContent);
    expect(allBoldAmounts).toEqual(dialogAmounts);
  });

  it("shows an empty history state when the selected deuda has no pagos", () => {
    const deudas = [makeDeuda({ id: "d1", nombre: "Sin pagos" })];
    render(<DeudasTable deudas={deudas} pagos={[]} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Ver historial"));
    expect(screen.getByText("No hay pagos registrados para esta deuda.")).toBeInTheDocument();
  });

  it("shows an empty state and does not crash when there are no deudas", () => {
    expect(() =>
      render(<DeudasTable deudas={[]} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />),
    ).not.toThrow();
    expect(screen.getByText("No hay deudas registradas.")).toBeInTheDocument();
  });
});
