import { useState } from "react";
import { CategoriaPersonalizada, CATEGORIAS_GASTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  categorias: CategoriaPersonalizada[];
  onAdd: (cat: Pick<CategoriaPersonalizada, "nombre" | "color">) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

export default function CategoriasManager({ categorias, onAdd, onDelete }: Props) {
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default blue
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    
    // Validar duplicados contra las categorias por defecto
    if (CATEGORIAS_GASTO.map(c => c.toLowerCase()).includes(nuevaCategoria.trim().toLowerCase())) {
      toast.error("Esta categoría ya existe por defecto.");
      return;
    }
    
    // Validar duplicados contra las categorias personalizadas
    if (categorias.map(c => c.nombre.toLowerCase()).includes(nuevaCategoria.trim().toLowerCase())) {
      toast.error("Ya existe una categoría personalizada con este nombre.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({ nombre: nuevaCategoria.trim(), color });
      setNuevaCategoria("");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta categoría? (Los gastos asociados la mantendrán como texto)")) {
      try {
        await onDelete(id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorías de Gasto</CardTitle>
        <CardDescription>Administra las categorías personalizadas para tus gastos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="nuevaCategoria">Nueva Categoría</Label>
            <Input 
              id="nuevaCategoria" 
              value={nuevaCategoria} 
              onChange={(e) => setNuevaCategoria(e.target.value)} 
              placeholder="Ej.: Mascotas, Suscripciones" 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center mt-1">
              <Input 
                id="color" 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-12 h-10 p-1 cursor-pointer"
              />
            </div>
          </div>
          <Button type="submit" disabled={!nuevaCategoria.trim() || isSubmitting}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </form>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Tus categorías predeterminadas:</h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_GASTO.map(cat => (
              <div key={cat} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {cat}
              </div>
            ))}
          </div>

          {categorias.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-muted-foreground mt-6">Tus categorías personalizadas:</h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="font-medium text-sm">{cat.nombre}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
