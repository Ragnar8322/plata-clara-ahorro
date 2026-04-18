import { useState } from "react";
import { MetaAhorro } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import AporteDialog from "./AporteDialog";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import MetaForm from "./MetaForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Props {
  meta: MetaAhorro;
  onUpdate: (meta: MetaAhorro) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function MetaCard({ meta, onUpdate, onDelete }: Props) {
  const { config } = useFinancialData();
  const [isAporteOpen, setIsAporteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const porcentaje = Math.min(100, Math.round((meta.monto_actual / meta.monto_objetivo) * 100));
  const isCompletada = meta.monto_actual >= meta.monto_objetivo;

  const handleAporte = async (monto: number) => {
    await onUpdate({
      ...meta,
      monto_actual: meta.monto_actual + monto,
      activa: meta.monto_actual + monto < meta.monto_objetivo
    });
    setIsAporteOpen(false);
  };

  const handleEdit = async (updated: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">) => {
    await onUpdate({ ...meta, ...updated });
    setIsEditOpen(false);
  };

  return (
    <Card className={`overflow-hidden border-t-4 ${isCompletada ? 'opacity-80' : ''}`} style={{ borderTopColor: meta.color }}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span>{meta.emoji}</span> {meta.nombre}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isCompletada ? "¡Meta alcanzada! 🎉" : meta.fecha_objetivo ? `Para: ${meta.fecha_objetivo}` : "Sin fecha límite"}
          </p>
        </div>
        <div className="flex gap-1">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Meta</DialogTitle>
                <DialogDescription>Modifica los detalles de tu meta.</DialogDescription>
              </DialogHeader>
              <MetaForm initialData={meta} onSubmit={handleEdit} onCancel={() => setIsEditOpen(false)} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará "{meta.nombre}". El dinero ahorrado no desaparecerá de tus cuentas reales, pero esta meta se borrará. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(meta.id)}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>{formatMoney(meta.monto_actual, config)}</span>
            <span className="text-muted-foreground">de {formatMoney(meta.monto_objetivo, config)}</span>
          </div>
          <Progress value={porcentaje} className="h-2" indicatorColor={meta.color} />
          <div className="text-right text-xs text-muted-foreground font-semibold">
            {porcentaje}%
          </div>
        </div>
        
        {meta.notas && (
          <p className="mt-4 text-xs italic text-muted-foreground line-clamp-2">
            "{meta.notas}"
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Dialog open={isAporteOpen} onOpenChange={setIsAporteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={isCompletada} style={{ backgroundColor: isCompletada ? undefined : meta.color }}>
              <Plus className="mr-2 h-4 w-4" />
              {isCompletada ? "Completada" : "Registrar Aporte"}
            </Button>
          </DialogTrigger>
          <AporteDialog 
            metaNombre={meta.nombre} 
            falta={meta.monto_objetivo - meta.monto_actual} 
            onSubmit={handleAporte} 
            onCancel={() => setIsAporteOpen(false)}
            sugerencia={meta.aporte_mensual_planeado}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
}
