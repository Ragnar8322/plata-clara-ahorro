import { useState } from "react";
import { Ingreso, Configuracion } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Banknote } from "lucide-react";

interface Props {
  ingresos: Ingreso[];
  config: Configuracion;
  onAdd: (ing: Omit<Ingreso, "id" | "user_id" | "created_at">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function IngresosManager({ ingresos, config, onAdd, onDelete }: Props) {
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");

  const handleAdd = async () => {
    const monto = parseFloat(nuevoMonto);
    if (!nuevoNombre || isNaN(monto)) return;

    await onAdd({
      nombre: nuevoNombre,
      monto,
      categoria: "Sueldo",
      frecuencia: "Mensual",
    });

    setNuevoNombre("");
    setNuevoMonto("");
  };

  const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          Fuentes de Ingreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Ej: Sueldo Principal"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Monto"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" /> Agregar
          </Button>
        </div>

        <div className="space-y-2">
          {ingresos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 italic">No hay fuentes de ingreso registradas.</p>
          ) : (
            ingresos.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <p className="text-sm font-medium">{ing.nombre}</p>
                  <p className="text-xs text-muted-foreground">{formatMoney(ing.monto, config)}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(ing.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {ingresos.length > 0 && (
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-semibold">Total Mensual:</span>
            <span className="text-lg font-bold text-primary">{formatMoney(totalIngresos, config)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
