import { useState } from "react";
import { Gasto, Configuracion, CategoriaPersonalizada, Deuda, PagoDeuda } from "@/types";
import GastoForm from "@/components/gastos/GastoForm";
import GastosTable from "@/components/gastos/GastosTable";

interface Props {
  gastos: Gasto[];
  deudas?: Deuda[];
  categorias?: CategoriaPersonalizada[];
  config: Configuracion;
  onAdd: (g: Omit<Gasto, "id">) => void | Promise<unknown>;
  onUpdate: (g: Gasto) => void | Promise<unknown>;
  onDelete: (id: string) => void | Promise<unknown>;
  onAddPagoDeuda?: (pago: Omit<PagoDeuda, "id" | "user_id" | "created_at">) => void | Promise<unknown>;
}

export default function GastosPage({ 
  gastos, deudas = [], categorias = [], config, 
  onAdd, onUpdate, onDelete, onAddPagoDeuda 
}: Props) {
  const [editando, setEditando] = useState<Gasto | null>(null);

  const handleSubmit = async (data: Omit<Gasto, "id"> & { id?: string; deudaId?: string }) => {
    if (data.id) {
      await onUpdate(data as Gasto);
      setEditando(null);
      return;
    }

    // El gasto va primero y se espera: antes el pago se disparaba sin await, así que si el gasto
    // fallaba el saldo de la deuda ya había bajado sin que existiera el gasto que lo justificaba.
    await onAdd(data);

    if (data.deudaId && onAddPagoDeuda) {
      await onAddPagoDeuda({
        deuda_id: data.deudaId,
        monto: data.monto,
        fecha: data.fecha,
        notas: `Pago automático desde Gasto: ${data.descripcion}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Gastos</h2>
      <GastoForm
        gastoEditar={editando}
        onSubmit={handleSubmit}
        onCancel={editando ? () => setEditando(null) : undefined}
        categorias={categorias}
        deudas={deudas}
      />
      <GastosTable
        gastos={gastos}
        config={config}
        onEdit={setEditando}
        onDelete={onDelete}
      />
    </div>
  );
}
