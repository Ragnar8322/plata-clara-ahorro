import { useState } from "react";
import { CategoriaPersonalizada, PresupuestoCategoria, Configuracion, CATEGORIAS_GASTO } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Trash2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  categorias: CategoriaPersonalizada[];
  presupuestos: PresupuestoCategoria[];
  config: Configuracion;
  onSave: (pres: Omit<PresupuestoCategoria, "id" | "user_id" | "created_at" | "updated_at">) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export default function PresupuestosManager({ categorias, presupuestos, config, onSave, onDelete }: Props) {
  const [editando, setEditando] = useState<Record<string, string>>({});

  // Se incluyen también las categorías que ya tienen presupuesto aunque hayan sido borradas:
  // de lo contrario el presupuesto quedaba huérfano, sin fila donde editarlo ni borrarlo, y el
  // dashboard seguía mostrando su alerta para siempre.
  const categoriasVigentes = new Set([...CATEGORIAS_GASTO, ...categorias.map(c => c.nombre)]);
  const todasCategorias = Array.from(
    new Set([...categoriasVigentes, ...presupuestos.map(p => p.categoria)]),
  );

  const handleMontoChange = (cat: string, val: string) => {
    setEditando(prev => ({ ...prev, [cat]: val }));
  };

  const handleSave = async (cat: string) => {
    const monto = parseFloat(editando[cat]);
    // Antes se retornaba en silencio y el botón Guardar simplemente no hacía nada.
    if (isNaN(monto)) {
      toast.error("Escribe un monto para el presupuesto de " + cat);
      return;
    }
    // Un límite en 0 nunca alcanza el umbral de alerta: sería un presupuesto muerto que el
    // usuario cree activo. Guardar 0 equivale a quitar el presupuesto.
    if (monto <= 0) {
      const existente = presupuestos.find(p => p.categoria === cat);
      if (existente) {
        await onDelete(existente.id);
        toast.success(`Presupuesto de ${cat} eliminado`);
      } else {
        toast.error("El presupuesto debe ser mayor a 0");
      }
      setEditando(prev => {
        const next = { ...prev };
        delete next[cat];
        return next;
      });
      return;
    }

    await onSave({
      categoria: cat,
      limite_mensual: monto,
    });
    
    setEditando(prev => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Presupuestos por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Define cuánto planeas gastar como máximo al mes en cada categoría. Te avisaremos cuando estés cerca del límite.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {todasCategorias.map((cat) => {
            const pres = presupuestos.find(p => p.categoria === cat);
            const valorActual = editando[cat] ?? pres?.limite_mensual.toString() ?? "0";
            const hayCambios = editando[cat] !== undefined && editando[cat] !== pres?.limite_mensual.toString();

            return (
              <div key={cat} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {cat}
                    {!categoriasVigentes.has(cat) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-normal text-warning">
                        <AlertTriangle className="h-3 w-3" />
                        categoría eliminada
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{config.monedaSimbolo}</span>
                    <CurrencyInput
                      className="h-8 w-32 text-sm"
                      value={valorActual === "" ? undefined : Number(valorActual)}
                      onChange={(v) => handleMontoChange(cat, v === undefined ? "" : String(v))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {hayCambios && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleSave(cat)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                  {pres && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(pres.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
