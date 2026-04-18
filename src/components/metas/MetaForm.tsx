import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MetaAhorro } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const metaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  emoji: z.string().min(1, "Selecciona un emoji").max(2, "Solo un emoji"),
  monto_objetivo: z.coerce.number().min(1, "El monto debe ser mayor a 0"),
  aporte_mensual_planeado: z.coerce.number().min(0, "Debe ser al menos 0"),
  fecha_objetivo: z.string().optional(),
  color: z.string(),
  notas: z.string().optional(),
});

type MetaFormValues = z.infer<typeof metaSchema>;

interface Props {
  initialData?: MetaAhorro;
  onSubmit: (data: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

export default function MetaForm({ initialData, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: {
      nombre: initialData?.nombre || "",
      emoji: initialData?.emoji || "🎯",
      monto_objetivo: initialData?.monto_objetivo || 1000000,
      aporte_mensual_planeado: initialData?.aporte_mensual_planeado || 0,
      fecha_objetivo: initialData?.fecha_objetivo || "",
      color: initialData?.color || "#16a34a",
      notas: initialData?.notas || "",
    },
  });

  const onSave = (data: MetaFormValues) => {
    onSubmit({
      ...data,
      monto_actual: initialData?.monto_actual || 0,
      activa: initialData?.activa ?? true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="emoji" className="text-right">Emoji</Label>
        <Input id="emoji" className="col-span-1" {...register("emoji")} />
        <div className="col-span-2 text-xs text-red-500">{errors.emoji?.message}</div>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="nombre" className="text-right">Nombre</Label>
        <Input id="nombre" className="col-span-3" {...register("nombre")} />
        <div className="col-span-4 text-xs text-red-500 text-right">{errors.nombre?.message}</div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="monto" className="text-right">Meta ($)</Label>
        <Input id="monto" type="number" step="0.01" className="col-span-3" {...register("monto_objetivo")} />
        <div className="col-span-4 text-xs text-red-500 text-right">{errors.monto_objetivo?.message}</div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="aporte" className="text-right">Aporte mes</Label>
        <Input id="aporte" type="number" step="0.01" className="col-span-3" {...register("aporte_mensual_planeado")} />
        <div className="col-span-4 text-xs text-red-500 text-right">{errors.aporte_mensual_planeado?.message}</div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="fecha" className="text-right">Para cuándo</Label>
        <Input id="fecha" type="date" className="col-span-3" {...register("fecha_objetivo")} />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="color" className="text-right">Color</Label>
        <Input id="color" type="color" className="col-span-1 h-10 px-1" {...register("color")} />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="notas" className="text-right">Notas</Label>
        <Textarea id="notas" className="col-span-3" {...register("notas")} />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar Meta</Button>
      </div>
    </form>
  );
}
