import { useState } from "react";
import { Gasto, Configuracion, CategoriaPersonalizada } from "@/types";
import GastoForm from "@/components/gastos/GastoForm";
import GastosTable from "@/components/gastos/GastosTable";

interface Props {
  gastos: Gasto[];
  categorias?: CategoriaPersonalizada[];
  config: Configuracion;
  onAdd: (g: Omit<Gasto, "id">) => void;
  onUpdate: (g: Gasto) => void;
  onDelete: (id: string) => void;
}

export default function GastosPage({ gastos, categorias = [], config, onAdd, onUpdate, onDelete }: Props) {
  const [editando, setEditando] = useState<Gasto | null>(null);

  const handleSubmit = (data: Omit<Gasto, "id"> & { id?: string }) => {
    if (data.id) {
      onUpdate(data as Gasto);
      setEditando(null);
    } else {
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
