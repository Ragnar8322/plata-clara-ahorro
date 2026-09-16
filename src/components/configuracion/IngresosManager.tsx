import { useState } from "react";
import {
  Ingreso, Configuracion, FrecuenciaIngreso, FRECUENCIAS_INGRESO, CATEGORIAS_INGRESO,
} from "@/types";
import { formatMoney } from "@/lib/formatters";
import {
  montoMensualEquivalente, totalIngresoMensual, DESCRIPCION_FRECUENCIA,
} from "@/lib/ingresos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Banknote, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  ingresos: Ingreso[];
  config: Configuracion;
  onAdd: (ing: Omit<Ingreso, "id" | "user_id" | "created_at">) => Promise<unknown>;
  onUpdate?: (ing: Ingreso) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

interface Borrador {
  nombre: string;
  monto: number | undefined;
  frecuencia: FrecuenciaIngreso;
  categoria: string;
}

const BORRADOR_VACIO: Borrador = {
  nombre: "",
  monto: undefined,
  frecuencia: "Mensual",
  categoria: "Sueldo",
};

function borradorDesde(ing: Ingreso): Borrador {
  return {
    nombre: ing.nombre,
    monto: ing.monto,
    frecuencia: ing.frecuencia,
    categoria: ing.categoria ?? "Otros",
  };
}

/** Devuelve el borrador saneado, o null (avisando al usuario) si falta algo. */
function validar(borrador: Borrador): (Borrador & { monto: number }) | null {
  if (!borrador.nombre.trim()) {
    toast.error("Ponle un nombre a la fuente de ingreso");
    return null;
  }
  if (!borrador.monto || borrador.monto <= 0) {
    toast.error("El monto debe ser mayor a 0");
    return null;
  }
  return { ...borrador, nombre: borrador.nombre.trim(), monto: borrador.monto };
}

function CamposIngreso({ borrador, onChange }: { borrador: Borrador; onChange: (b: Borrador) => void }) {
  return (
    <>
      <div className="lg:col-span-2">
        <Label className="text-xs">Nombre</Label>
        <Input
          placeholder="Ej: Sueldo Principal"
          aria-label="Nombre"
          value={borrador.nombre}
          onChange={(e) => onChange({ ...borrador, nombre: e.target.value })}
        />
      </div>
      <div>
        <Label className="text-xs">Monto por pago</Label>
        <CurrencyInput
          placeholder="Monto"
          value={borrador.monto}
          onChange={(v) => onChange({ ...borrador, monto: v })}
        />
      </div>
      <div>
        <Label className="text-xs">Frecuencia</Label>
        <Select
          value={borrador.frecuencia}
          onValueChange={(v: FrecuenciaIngreso) => onChange({ ...borrador, frecuencia: v })}
        >
          <SelectTrigger aria-label="Frecuencia"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FRECUENCIAS_INGRESO.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Categoría</Label>
        <Select value={borrador.categoria} onValueChange={(v) => onChange({ ...borrador, categoria: v })}>
          <SelectTrigger aria-label="Categoría"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS_INGRESO.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export default function IngresosManager({ ingresos, config, onAdd, onUpdate, onDelete }: Props) {
  const [nuevo, setNuevo] = useState<Borrador>(BORRADOR_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Borrador>(BORRADOR_VACIO);

  const handleAdd = async () => {
    const valido = validar(nuevo);
    if (!valido) return;

    await onAdd({
      nombre: valido.nombre,
      monto: valido.monto,
      categoria: valido.categoria,
      frecuencia: valido.frecuencia,
    });

    setNuevo(BORRADOR_VACIO);
  };

  const guardarEdicion = async (ing: Ingreso) => {
    const valido = validar(edicion);
    if (!valido) return;

    await onUpdate?.({
      ...ing,
      nombre: valido.nombre,
      monto: valido.monto,
      categoria: valido.categoria,
      frecuencia: valido.frecuencia,
    });

    setEditandoId(null);
  };

  const totalMensual = totalIngresoMensual(ingresos);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          Fuentes de Ingreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Registra tu salario y cualquier otra entrada. Si te pagan quincenal, escribe lo que recibes
          en <strong>una</strong> quincena: se multiplica por 2 para calcular tu ingreso mensual.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end p-3 rounded-lg border bg-muted/30">
          <CamposIngreso borrador={nuevo} onChange={setNuevo} />
          <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {DESCRIPCION_FRECUENCIA[nuevo.frecuencia]}
              {nuevo.frecuencia === "Quincenal" && nuevo.monto
                ? ` · equivale a ${formatMoney(nuevo.monto * 2, config)} al mes`
                : ""}
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" /> Agregar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {ingresos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 italic">No hay fuentes de ingreso registradas.</p>
          ) : (
            ingresos.map((ing) => {
              if (editandoId === ing.id) {
                return (
                  <div
                    key={ing.id}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end p-3 rounded-lg border border-primary bg-card"
                  >
                    <CamposIngreso borrador={edicion} onChange={setEdicion} />
                    <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" onClick={() => guardarEdicion(ing)}>
                        <Save className="h-4 w-4 mr-1" /> Guardar
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={ing.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                      {ing.nombre}
                      <Badge variant="secondary" className="text-[10px] font-normal">{ing.categoria ?? "Otros"}</Badge>
                      <Badge variant="outline" className="text-[10px] font-normal">{ing.frecuencia}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(ing.monto, config)} por pago
                      {ing.frecuencia === "Quincenal" && ` · ${formatMoney(montoMensualEquivalente(ing), config)} al mes`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onUpdate && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Editar ${ing.nombre}`}
                        onClick={() => {
                          setEditandoId(ing.id);
                          setEdicion(borradorDesde(ing));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      aria-label={`Eliminar ${ing.nombre}`}
                      onClick={() => onDelete(ing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {ingresos.length > 0 && (
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-semibold">Ingreso mensual total:</span>
            <span className="text-lg font-bold text-primary">{formatMoney(totalMensual, config)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
