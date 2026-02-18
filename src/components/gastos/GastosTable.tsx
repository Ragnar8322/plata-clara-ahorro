import { useState, useMemo } from "react";
import { Gasto, Configuracion, CATEGORIAS_GASTO, METODOS_PAGO } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  gastos: Gasto[];
  config: Configuracion;
  onEdit: (gasto: Gasto) => void;
  onDelete: (id: string) => void;
}

export default function GastosTable({ gastos, config, onEdit, onDelete }: Props) {
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [filtroMetodo, setFiltroMetodo] = useState("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      if (filtroCategoria !== "all" && g.categoria !== filtroCategoria) return false;
      if (filtroMetodo !== "all" && g.metodoPago !== filtroMetodo) return false;
      if (fechaDesde && g.fecha < fechaDesde) return false;
      if (fechaHasta && g.fecha > fechaHasta) return false;
      return true;
    });
  }, [gastos, filtroCategoria, filtroMetodo, fechaDesde, fechaHasta]);

  const total = useMemo(() => gastosFiltrados.reduce((s, g) => s + g.monto, 0), [gastosFiltrados]);

  const totalesPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    gastosFiltrados.forEach((g) => {
      map[g.categoria] = (map[g.categoria] || 0) + g.monto;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [gastosFiltrados]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground">Desde</label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hasta</label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIAS_GASTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Método</label>
              <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {METODOS_PAGO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[180px]">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total gastos filtrados</p>
            <p className="text-xl font-bold text-foreground">{formatMoney(total, config)}</p>
          </CardContent>
        </Card>
        {totalesPorCategoria.slice(0, 4).map(([cat, val]) => (
          <Card key={cat} className="min-w-[140px]">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className="text-sm font-semibold">{formatMoney(val, config)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {gastosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hay gastos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Frec.</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastosFiltrados.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="whitespace-nowrap">{g.fecha}</TableCell>
                    <TableCell>{g.categoria}</TableCell>
                    <TableCell>{g.descripcion}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(g.monto, config)}</TableCell>
                    <TableCell>{g.metodoPago}</TableCell>
                    <TableCell>{g.tipo}</TableCell>
                    <TableCell>{g.frecuencia}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(g)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará "{g.descripcion}". Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(g.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
