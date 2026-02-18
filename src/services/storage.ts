import { Gasto, Deuda, Configuracion } from "@/types";

const KEYS = {
  gastos: "finapp_gastos",
  deudas: "finapp_deudas",
  configuracion: "finapp_configuracion",
};

const defaultConfig: Configuracion = {
  id: "config-principal",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

function generateId(): string {
  return crypto.randomUUID();
}

// Seed data
const seedGastos: Gasto[] = [
  {
    id: generateId(),
    fecha: new Date().toISOString().split("T")[0],
    categoria: "Vivienda",
    descripcion: "Arriendo apartamento",
    monto: 1200000,
    metodoPago: "Transferencia",
    tipo: "Fijo",
    frecuencia: "Mensual",
  },
  {
    id: generateId(),
    fecha: new Date().toISOString().split("T")[0],
    categoria: "Alimentación",
    descripcion: "Mercado semanal",
    monto: 250000,
    metodoPago: "Débito",
    tipo: "Variable",
    frecuencia: "Semanal",
  },
  {
    id: generateId(),
    fecha: new Date().toISOString().split("T")[0],
    categoria: "Transporte",
    descripcion: "Gasolina",
    monto: 180000,
    metodoPago: "Tarjeta de crédito",
    tipo: "Variable",
    frecuencia: "Mensual",
  },
];

const seedDeudas: Deuda[] = [
  {
    id: generateId(),
    nombre: "Tarjeta Crédito Banco Bogotá",
    tipo: "Tarjeta de crédito",
    entidad: "Banco de Bogotá",
    saldoInicial: 3500000,
    saldoActual: 2800000,
    tasaInteresAnual: 28.5,
    pagoMinimoMensual: 140000,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
  },
  {
    id: generateId(),
    nombre: "Tarjeta Crédito Bancolombia",
    tipo: "Tarjeta de crédito",
    entidad: "Bancolombia",
    saldoInicial: 5000000,
    saldoActual: 4200000,
    tasaInteresAnual: 26.0,
    pagoMinimoMensual: 210000,
    diaCorteOPago: 20,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
  },
  {
    id: generateId(),
    nombre: "Crédito Libre Inversión",
    tipo: "Crédito personal",
    entidad: "Davivienda",
    saldoInicial: 8000000,
    saldoActual: 6500000,
    tasaInteresAnual: 22.0,
    pagoMinimoMensual: 350000,
    diaCorteOPago: 5,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
  },
];

const seedConfig: Configuracion = {
  ...defaultConfig,
  ingresoMensualNeto: 4500000,
  presupuestoMensualParaDeudas: 900000,
};

// Storage functions
export function loadGastos(): Gasto[] {
  const data = localStorage.getItem(KEYS.gastos);
  if (!data) {
    saveGastos(seedGastos);
    return seedGastos;
  }
  return JSON.parse(data);
}

export function saveGastos(gastos: Gasto[]): void {
  localStorage.setItem(KEYS.gastos, JSON.stringify(gastos));
}

export function loadDeudas(): Deuda[] {
  const data = localStorage.getItem(KEYS.deudas);
  if (!data) {
    saveDeudas(seedDeudas);
    return seedDeudas;
  }
  return JSON.parse(data);
}

export function saveDeudas(deudas: Deuda[]): void {
  localStorage.setItem(KEYS.deudas, JSON.stringify(deudas));
}

export function loadConfiguracion(): Configuracion {
  const data = localStorage.getItem(KEYS.configuracion);
  if (!data) {
    saveConfiguracion(seedConfig);
    return seedConfig;
  }
  return JSON.parse(data);
}

export function saveConfiguracion(config: Configuracion): void {
  localStorage.setItem(KEYS.configuracion, JSON.stringify(config));
}

export function newGastoId(): string {
  return generateId();
}

export function newDeudaId(): string {
  return generateId();
}
