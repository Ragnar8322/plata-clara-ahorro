import { useState } from "react";
import { Deuda, Configuracion } from "@/types";
import DeudaForm from "@/components/deudas/DeudaForm";
import DeudasTable from "@/components/deudas/DeudasTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  deudas: Deuda[];
  config: Configuracion;
  onAdd: (d: Omit<Deuda, "id">) => void;
  onUpdate: (d: Deuda) => void;
  onDelete: (id: string) => void;
}

export default function DeudasPage({ deudas, config, onAdd, onUpdate, onDelete }: Props) {
  const [editando, setEditando] = useState<Deuda | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (data: Omit<Deuda, "id"> & { id?: string }) => {
    if (data.id) {
      onUpdate(data as Deuda);
      setEditando(null);
    } else {
      onAdd(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Deudas</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/proyeccion")}>
          Ver proyección de pagos →
        </Button>
      </div>
      <DeudaForm
        deudaEditar={editando}
        onSubmit={handleSubmit}
        onCancel={editando ? () => setEditando(null) : undefined}
      />
      <DeudasTable
        deudas={deudas}
        config={config}
        onEdit={setEditando}
        onDelete={onDelete}
      />
    </div>
  );
}
