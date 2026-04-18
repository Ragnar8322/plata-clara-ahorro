export interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  metodoPago: MetodoPago;
  tipo: TipoGasto;
  frecuencia: Frecuencia;
  notas?: string;
}

export type MetodoPago =
  | "Efectivo"
  | "Débito"
  | "Tarjeta de crédito"
  | "Transferencia"
  | "Otro";

export type TipoGasto = "Fijo" | "Variable";

export type Frecuencia = "Único" | "Mensual" | "Semanal" | "Anual";

export interface Deuda {
  id: string;
  nombre: string;
  tipo: TipoDeuda;
  entidad: string;
  saldoInicial: number;
  saldoActual: number;
  tasaInteresAnual: number;
  pagoMinimoMensual: number;
  diaCorteOPago: number;
  pagoExtraPlaneadoMensual: number;
  activa: boolean;
  notas?: string;
}

export type TipoDeuda =
  | "Tarjeta de crédito"
  | "Crédito personal"
  | "Crédito vehículo"
  | "Hipoteca"
  | "Otro";

export type EstrategiaOrden = "SaldoAscendente" | "InteresDescendente";

export interface Configuracion {
  id: string;
  ingresoMensualNeto: number;
  monedaSimbolo: string;
  nombreMoneda: string;
  presupuestoMensualParaDeudas: number;
  mesesMaxProyeccion: number;
  estrategiaOrdenDeudas: EstrategiaOrden;
}

export const CATEGORIAS_GASTO_DEFAULT = [
  "Vivienda", "Alimentación", "Transporte", "Servicios", "Salud",
  "Entretenimiento", "Educación", "Deudas", "Ahorro", "Otros",
];

export const METODOS_PAGO: MetodoPago[] = [
  "Efectivo", "Débito", "Tarjeta de crédito", "Transferencia", "Otro",
];

export const TIPOS_GASTO: TipoGasto[] = ["Fijo", "Variable"];

export const FRECUENCIAS: Frecuencia[] = ["Único", "Mensual", "Semanal", "Anual"];

export const TIPOS_DEUDA: TipoDeuda[] = [
  "Tarjeta de crédito", "Crédito personal", "Crédito vehículo", "Hipoteca", "Otro",
];

// Snowball simulation result types
export interface PagoMensualDeuda {
  deudaId: string;
  nombreDeuda: string;
  pagoTotal: number;
  abonoInteres: number;
  abonoCapital: number;
  saldoFinal: number;
  pagada: boolean;
}

export interface MesSimulado {
  mesNumero: number;
  fecha: string; // "YYYY-MM"
  pagos: PagoMensualDeuda[];
}

export interface ResumenDeudaProyeccion {
  prioridad: number;
  deudaId: string;
  nombreDeuda: string;
  saldoInicialSimulacion: number;
  tasaInteresAnual: number;
  pagoMinimoMensual: number;
  mesEstimadoPago: number | null; // null if not paid within range
  fechaEstimadaPago: string | null;
}

export interface ResultadoSimulacion {
  ordenPago: ResumenDeudaProyeccion[];
  calendario: MesSimulado[];
  mesLibreDeDeudas: number | null;
  fechaLibreDeDeudas: string | null;
  totalInteresesPagados: number;
  mesesSimulados: number;
}

export interface MetaAhorro {
  id: string;
  user_id?: string;
  nombre: string;
  emoji: string;
  monto_objetivo: number;
  monto_actual: number;
  aporte_mensual_planeado: number;
  fecha_objetivo?: string; // YYYY-MM-DD
  activa: boolean;
  color: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  estado?: string;
}

export interface CategoriaPersonalizada {
  id: string;
  user_id?: string;
  nombre: string;
  color: string;
  created_at?: string;
}

export interface PagoDeuda {
  id: string;
  user_id?: string;
  deuda_id: string;
  monto: number;
  fecha: string;
  notas?: string;
  created_at?: string;
}

export interface PresupuestoCategoria {
  id: string;
  user_id?: string;
  categoria: string;
  limite_mensual: number;
  created_at?: string;
  updated_at?: string;
}

export interface Ingreso {
  id: string;
  user_id?: string;
  nombre: string;
  monto: number;
  categoria?: string;
  frecuencia?: string;
  created_at?: string;
}
