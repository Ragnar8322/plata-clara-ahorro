import { useState } from "react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { MetaAhorro } from "@/types";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import MetaCard from "@/components/metas/MetaCard";
import MetaForm from "@/components/metas/MetaForm";

export default function MetasPage() {
  const { metas, addMeta, updateMeta, deleteMeta } = useFinancialData();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddMeta = async (meta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">) => {
    await addMeta(meta);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Metas de Ahorro
          </h2>
          <p className="text-muted-foreground">Define tus objetivos y sigue tu progreso.</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
              <DialogDescription>Define qué quieres lograr y cuánto necesitas.</DialogDescription>
            </DialogHeader>
            <MetaForm onSubmit={handleAddMeta} onCancel={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Target className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No tienes metas aún</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
            Empieza a darle propósito a tus ahorros. Crear metas claras aumenta tu probabilidad de alcanzarlas.
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear tu primera meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metas.map((meta) => (
            <MetaCard 
              key={meta.id} 
              meta={meta} 
              onUpdate={updateMeta}
              onDelete={deleteMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
