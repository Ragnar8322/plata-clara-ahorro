import { useState, useMemo } from "react";
import { Deuda, Configuracion, PagoDeuda } from "@/types";
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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import ReportarPagoDialog from "@/components/deudas/ReportarPagoDialog";
import { Pencil, Trash2, Banknote, Clock } from "lucide-react";

interface Props {
  deudas: Deuda[];
  pagos?: PagoDeuda[];
  config: Configuracion;
  onEdit: (deuda: Deuda) => void;
  onDelete: (id: string) => void;
  onAddPago?: (p: Omit<PagoDeuda, "id" | "user_id" | "created_at">) => Promise<any>;
  onDeletePago?: (id: string) => Promise<any>;
}

export default function DeudasTable({ deudas, pagos = [], config, onEdit, onDelete, onAddPago, onDeletePago }: Props) {
  const activas = useMemo(() => deudas.filter((d) => d.activa), [deudas]);
  const totalSaldo = useMemo(() => activas.reduce((s, d) => s + d.saldoActual, 0), [activas]);
  const totalMinimos = useMemo(() => activas.reduce((s, d) => s + d.pagoMinimoMensual, 0), [activas]);
  const totalExtra = useMemo(() => activas.reduce((s, d) => s + d.pagoExtraPlaneadoMensual, 0), [activas]);

  // Modals state
  const [reportarPagoDeuda, setReportarPagoDeuda] = useState<Deuda | null>(null);
  const [verHistorialDeuda, setVerHistorialDeuda] = useState<Deuda | null>(null);

  const historialDeLaDeuda = useMemo(() => {
    if (!verHistorialDeuda) return [];
    return pagos
      .filter(p => p.deuda_id === verHistorialDeuda.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [verHistorialDeuda, pagos]);

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
                  <TableHead className="text-right">Acciones</TableHead>
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
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" title="Reportar pago" onClick={() => setReportarPagoDeuda(d)}>
                          <Banknote className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Ver historial" onClick={() => setVerHistorialDeuda(d)}>
                          <Clock className="h-4 w-4" />
                        </Button>
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
                                Se eliminará "{d.nombre}" y todo su historial de pagos. Esta acción no se puede deshacer.
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

      {/* Reportar Pago Dialog */}
      <ReportarPagoDialog
        open={!!reportarPagoDeuda}
        onOpenChange={(open) => !open && setReportarPagoDeuda(null)}
        deudas={deudas}
        deudaPreseleccionada={reportarPagoDeuda}
        onSubmit={onAddPago}
      />

      {/* Historial Dialog */}
      <Dialog open={!!verHistorialDeuda} onOpenChange={(open) => !open && setVerHistorialDeuda(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Historial de Pagos</DialogTitle>
            <DialogDescription>
              Pagos registrados para <strong>{verHistorialDeuda?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {historialDeLaDeuda.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No hay pagos registrados para esta deuda.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {historialDeLaDeuda.map(pago => (
                  <div key={pago.id} className="flex flex-col gap-1 p-3 border rounded-md text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{formatMoney(pago.monto, config)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{pago.fecha}</span>
                        {onDeletePago && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDeletePago(pago.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {pago.notas && <p className="text-muted-foreground italic truncate">{pago.notas}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setVerHistorialDeuda(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
