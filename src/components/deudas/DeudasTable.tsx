import { Deuda, Configuracion } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";

interface Props {
  deudas: Deuda[];
  config: Configuracion;
  onEdit: (deuda: Deuda) => void;
  onDelete: (id: string) => void;
}

export default function DeudasTable({ deudas, config, onEdit, onDelete }: Props) {
  const activas = useMemo(() => deudas.filter((d) => d.activa), [deudas]);
  const totalSaldo = useMemo(() => activas.reduce((s, d) => s + d.saldoActual, 0), [activas]);
  const totalMinimos = useMemo(() => activas.reduce((s, d) => s + d.pagoMinimoMensual, 0), [activas]);
  const totalExtra = useMemo(() => activas.reduce((s, d) => s + d.pagoExtraPlaneadoMensual, 0), [activas]);

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[170px]">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Saldo total deudas activas</p>
            <p className="text-xl font-bold text-foreground">{formatMoney(totalSaldo, config)}</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[170px]">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pagos mínimos mensuales</p>
            <p className="text-lg font-semibold">{formatMoney(totalMinimos, config)}</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[170px]">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pagos extra planeados</p>
            <p className="text-lg font-semibold">{formatMoney(totalExtra, config)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {deudas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No hay deudas registradas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="text-right">Saldo actual</TableHead>
                  <TableHead className="text-right">Tasa %</TableHead>
                  <TableHead className="text-right">Pago mín.</TableHead>
                  <TableHead className="text-right">Extra</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deudas.map((d) => (
                  <TableRow key={d.id} className={!d.activa ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{d.nombre}</TableCell>
                    <TableCell>{d.tipo}</TableCell>
                    <TableCell>{d.entidad}</TableCell>
                    <TableCell className="text-right">{formatMoney(d.saldoActual, config)}</TableCell>
                    <TableCell className="text-right">{d.tasaInteresAnual}%</TableCell>
                    <TableCell className="text-right">{formatMoney(d.pagoMinimoMensual, config)}</TableCell>
                    <TableCell className="text-right">{formatMoney(d.pagoExtraPlaneadoMensual, config)}</TableCell>
                    <TableCell>{d.diaCorteOPago}</TableCell>
                    <TableCell>
                      <Badge variant={d.activa ? "default" : "secondary"}>
                        {d.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(d)}>
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
                              <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará "{d.nombre}". Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(d.id)}>Eliminar</AlertDialogAction>
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
