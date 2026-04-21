import { useState } from "react";
import { Gasto, Configuracion, CategoriaPersonalizada, Deuda, PagoDeuda } from "@/types";
import GastoForm from "@/components/gastos/GastoForm";
import GastosTable from "@/components/gastos/GastosTable";

interface Props {
  gastos: Gasto[];
  deudas?: Deuda[];
  categorias?: CategoriaPersonalizada[];
  config: Configuracion;
  onAdd: (g: Omit<Gasto, "id">) => void;
  onUpdate: (g: Gasto) => void;
  onDelete: (id: string) => void;
  onAddPagoDeuda?: (pago: Omit<PagoDeuda, "id">) => void;
}

export default function GastosPage({ 
  gastos, deudas = [], categorias = [], config, 
  onAdd, onUpdate, onDelete, onAddPagoDeuda 
}: Props) {
  const [editando, setEditando] = useState<Gasto | null>(null);

  const handleSubmit = (data: Omit<Gasto, "id"> & { id?: string; deudaId?: string }) => {
    if (data.id) {
      onUpdate(data as Gasto);
      setEditando(null);
    } else {
      // Si hay vinculación a deuda, registrar el pago también
      if (data.deudaId && onAddPagoDeuda) {
        onAddPagoDeuda({
          deuda_id: data.deudaId,
          monto: data.monto,
          fecha: data.fecha,
          notas: `Pago automático desde Gasto: ${data.descripcion}`
        });
      }
      onAdd(data);
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
