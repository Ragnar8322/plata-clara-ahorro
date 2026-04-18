import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Gasto, CATEGORIAS_GASTO_DEFAULT, METODOS_PAGO, TIPOS_GASTO, FRECUENCIAS, CategoriaPersonalizada, Deuda } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const gastoSchema = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  categoria: z.string().min(1, "La categoría es obligatoria"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  monto: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  metodoPago: z.enum(METODOS_PAGO as [string, ...string[]], {
    required_error: "El método de pago es obligatorio",
  }),
  tipo: z.enum(TIPOS_GASTO as [string, ...string[]], {
    required_error: "El tipo es obligatorio",
  }),
  frecuencia: z.enum(FRECUENCIAS as [string, ...string[]]).default("Único"),
  notas: z.string().optional(),
  deudaId: z.string().optional(),
});

type FormValues = z.infer<typeof gastoSchema>;

interface GastoFormProps {
  gastoEditar?: Gasto | null;
  categorias?: CategoriaPersonalizada[];
  deudas?: Deuda[];
  onSubmit: (gasto: Omit<Gasto, "id"> & { id?: string; deudaId?: string }) => void;
  onCancel?: () => void;
}

export default function GastoForm({ gastoEditar, categorias = [], deudas = [], onSubmit, onCancel }: GastoFormProps) {
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      categoria: "",
      descripcion: "",
      monto: undefined as unknown as number,
      metodoPago: undefined,
      tipo: undefined,
      frecuencia: "Único",
      notas: "",
      deudaId: "",
    },
  });

  const categoriaSeleccionada = watch("categoria");

  useEffect(() => {
    if (gastoEditar) {
      reset({
        fecha: gastoEditar.fecha,
        categoria: gastoEditar.categoria,
        descripcion: gastoEditar.descripcion,
        monto: gastoEditar.monto,
        metodoPago: gastoEditar.metodoPago,
        tipo: gastoEditar.tipo,
        frecuencia: gastoEditar.frecuencia,
        notas: gastoEditar.notas || "",
      });
    } else {
      reset({
        fecha: new Date().toISOString().split("T")[0],
        categoria: "",
        descripcion: "",
        monto: undefined as any,
        metodoPago: undefined as any,
        tipo: undefined as any,
        frecuencia: "Único",
        notas: "",
      });
    }
  }, [gastoEditar, reset]);

  const onValidSubmit = (data: FormValues) => {
    onSubmit({
      ...(gastoEditar ? { id: gastoEditar.id } : {}),
      fecha: data.fecha,
      categoria: data.categoria as Gasto["categoria"],
      descripcion: data.descripcion,
      monto: data.monto,
      metodoPago: data.metodoPago as Gasto["metodoPago"],
      tipo: data.tipo as Gasto["tipo"],
      frecuencia: data.frecuencia as Gasto["frecuencia"],
      notas: data.notas || undefined,
      deudaId: data.categoria === "Deudas" ? data.deudaId : undefined,
    });
    if (!gastoEditar) {
      reset({
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        monto: undefined as any,
        notas: "",
        // Keep previously selected categoria, metodoPago, tipo, frecuencia for speed entry
      });
    }
  };

  const opcionesCategoria = useMemo(() => {
    const list = [...CATEGORIAS_GASTO_DEFAULT];
    categorias.forEach(c => {
      if (!list.includes(c.nombre)) {
        list.push(c.nombre);
      }
    });
    return list.sort();
  }, [categorias]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          {gastoEditar ? "Editar gasto" : "Registrar nuevo gasto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValidSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fecha">Fecha *</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && <p className="text-xs text-destructive mt-1">{errors.fecha.message}</p>}
          </div>

          <div>
            <Label>Categoría *</Label>
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {opcionesCategoria.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria && <p className="text-xs text-destructive mt-1">{errors.categoria.message}</p>}
          </div>

          {categoriaSeleccionada === "Deudas" && deudas.length > 0 && (
            <div>
              <Label>Vincular a Deuda</Label>
              <Controller
                name="deudaId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar deuda..." /></SelectTrigger>
                    <SelectContent>
                      {deudas.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nombre} (Saldo: {d.saldoActual})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Esto registrará un pago automático en la deuda seleccionada.
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <Label htmlFor="desc">Descripción *</Label>
            <Input id="desc" placeholder="Ej.: Arriendo mensual" {...register("descripcion")} />
            {errors.descripcion && <p className="text-xs text-destructive mt-1">{errors.descripcion.message}</p>}
          </div>

          <div>
            <Label htmlFor="monto">Monto *</Label>
            <Input id="monto" type="number" min="0" step="0.01" placeholder="0" {...register("monto")} />
            {errors.monto && <p className="text-xs text-destructive mt-1">{errors.monto.message}</p>}
          </div>

          <div>
            <Label>Método de pago *</Label>
            <Controller
              name="metodoPago"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.metodoPago && <p className="text-xs text-destructive mt-1">{errors.metodoPago.message}</p>}
          </div>

          <div>
            <Label>Tipo *</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_GASTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo.message}</p>}
          </div>

          <div>
            <Label>Frecuencia</Label>
            <Controller
              name="frecuencia"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" rows={2} placeholder="Notas adicionales..." {...register("notas")} />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit">{gastoEditar ? "Guardar cambios" : "Agregar gasto"}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
