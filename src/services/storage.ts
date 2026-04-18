import { Gasto, Deuda, Configuracion, EstrategiaOrden } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// ─── Gastos ───

export async function loadGastos(): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    fecha: row.fecha,
    categoria: row.categoria as Gasto["categoria"],
    descripcion: row.descripcion,
    monto: Number(row.monto),
    metodoPago: row.metodo_pago as Gasto["metodoPago"],
    tipo: row.tipo as Gasto["tipo"],
    frecuencia: row.frecuencia as Gasto["frecuencia"],
    notas: row.notas ?? undefined,
  }));
}

export async function saveGasto(gasto: Omit<Gasto, "id">, userId: string): Promise<Gasto> {
  const { data, error } = await supabase
    .from("gastos")
    .insert({
      user_id: userId,
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      metodo_pago: gasto.metodoPago,
      tipo: gasto.tipo,
      frecuencia: gasto.frecuencia,
      notas: gasto.notas ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    fecha: data.fecha,
    categoria: data.categoria as Gasto["categoria"],
    descripcion: data.descripcion,
    monto: Number(data.monto),
    metodoPago: data.metodo_pago as Gasto["metodoPago"],
    tipo: data.tipo as Gasto["tipo"],
    frecuencia: data.frecuencia as Gasto["frecuencia"],
    notas: data.notas ?? undefined,
  };
}

export async function updateGasto(gasto: Gasto): Promise<void> {
  const { error } = await supabase
    .from("gastos")
    .update({
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      metodo_pago: gasto.metodoPago,
      tipo: gasto.tipo,
      frecuencia: gasto.frecuencia,
      notas: gasto.notas ?? null,
    })
    .eq("id", gasto.id);

  if (error) throw error;
}

export async function deleteGasto(id: string): Promise<void> {
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) throw error;
}

// ─── Deudas ───

export async function loadDeudas(): Promise<Deuda[]> {
  const { data, error } = await supabase
    .from("deudas")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo as Deuda["tipo"],
    entidad: row.entidad,
    saldoInicial: Number(row.saldo_inicial),
    saldoActual: Number(row.saldo_actual),
    tasaInteresAnual: Number(row.tasa_interes_anual),
    pagoMinimoMensual: Number(row.pago_minimo_mensual),
    diaCorteOPago: row.dia_corte_o_pago,
    pagoExtraPlaneadoMensual: Number(row.pago_extra_planeado_mensual),
    activa: row.activa,
    notas: row.notas ?? undefined,
  }));
}

export async function saveDeuda(deuda: Omit<Deuda, "id">, userId: string): Promise<Deuda> {
  const { data, error } = await supabase
    .from("deudas")
    .insert({
      user_id: userId,
      nombre: deuda.nombre,
      tipo: deuda.tipo,
      entidad: deuda.entidad,
      saldo_inicial: deuda.saldoInicial,
      saldo_actual: deuda.saldoActual,
      tasa_interes_anual: deuda.tasaInteresAnual,
      pago_minimo_mensual: deuda.pagoMinimoMensual,
      dia_corte_o_pago: deuda.diaCorteOPago,
      pago_extra_planeado_mensual: deuda.pagoExtraPlaneadoMensual,
      activa: deuda.activa,
      notas: deuda.notas ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    nombre: data.nombre,
    tipo: data.tipo as Deuda["tipo"],
    entidad: data.entidad,
    saldoInicial: Number(data.saldo_inicial),
    saldoActual: Number(data.saldo_actual),
    tasaInteresAnual: Number(data.tasa_interes_anual),
    pagoMinimoMensual: Number(data.pago_minimo_mensual),
    diaCorteOPago: data.dia_corte_o_pago,
    pagoExtraPlaneadoMensual: Number(data.pago_extra_planeado_mensual),
    activa: data.activa,
    notas: data.notas ?? undefined,
  };
}

export async function updateDeuda(deuda: Deuda): Promise<void> {
  const { error } = await supabase
    .from("deudas")
    .update({
      nombre: deuda.nombre,
      tipo: deuda.tipo,
      entidad: deuda.entidad,
      saldo_inicial: deuda.saldoInicial,
      saldo_actual: deuda.saldoActual,
      tasa_interes_anual: deuda.tasaInteresAnual,
      pago_minimo_mensual: deuda.pagoMinimoMensual,
      dia_corte_o_pago: deuda.diaCorteOPago,
      pago_extra_planeado_mensual: deuda.pagoExtraPlaneadoMensual,
      activa: deuda.activa,
      notas: deuda.notas ?? null,
    })
    .eq("id", deuda.id);

  if (error) throw error;
}

export async function deleteDeuda(id: string): Promise<void> {
  const { error } = await supabase.from("deudas").delete().eq("id", id);
  if (error) throw error;
}

// ─── Configuración ───

const defaultConfig: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

export async function loadConfiguracion(): Promise<Configuracion> {
  const { data, error } = await supabase
    .from("configuracion")
    .select("*")
    .maybeSingle();

  if (error) throw error;

  if (!data) return defaultConfig;

  return {
    id: data.id,
    ingresoMensualNeto: Number(data.ingreso_mensual_neto),
    monedaSimbolo: data.moneda_simbolo,
    nombreMoneda: data.nombre_moneda,
    presupuestoMensualParaDeudas: Number(data.presupuesto_mensual_para_deudas),
    mesesMaxProyeccion: data.meses_max_proyeccion,
    estrategiaOrdenDeudas: data.estrategia_orden_deudas as EstrategiaOrden,
  };
}

export async function saveConfiguracion(config: Configuracion, userId: string): Promise<Configuracion> {
  const { data, error } = await supabase
    .from("configuracion")
    .upsert({
      id: config.id === "default" ? undefined : config.id,
      user_id: userId,
      ingreso_mensual_neto: config.ingresoMensualNeto,
      moneda_simbolo: config.monedaSimbolo,
      nombre_moneda: config.nombreMoneda,
      presupuesto_mensual_para_deudas: config.presupuestoMensualParaDeudas,
      meses_max_proyeccion: config.mesesMaxProyeccion,
      estrategia_orden_deudas: config.estrategiaOrdenDeudas,
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    ingresoMensualNeto: Number(data.ingreso_mensual_neto),
    monedaSimbolo: data.moneda_simbolo,
    nombreMoneda: data.nombre_moneda,
    presupuestoMensualParaDeudas: Number(data.presupuesto_mensual_para_deudas),
    mesesMaxProyeccion: data.meses_max_proyeccion,
    estrategiaOrdenDeudas: data.estrategia_orden_deudas as EstrategiaOrden,
  };
}

// ─── Categorías Personalizadas ───
import { CategoriaPersonalizada, PagoDeuda } from "@/types";

export async function loadCategorias(): Promise<CategoriaPersonalizada[]> {
  const { data, error } = await supabase
    .from("categorias_gasto")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    nombre: row.nombre,
    color: row.color,
    created_at: row.created_at,
  }));
}

export async function saveCategoria(cat: Omit<CategoriaPersonalizada, "id" | "user_id" | "created_at">, userId: string): Promise<CategoriaPersonalizada> {
  const { data, error } = await supabase
    .from("categorias_gasto")
    .insert({
      user_id: userId,
      nombre: cat.nombre,
      color: cat.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoria(cat: CategoriaPersonalizada): Promise<void> {
  const { error } = await supabase
    .from("categorias_gasto")
    .update({
      nombre: cat.nombre,
      color: cat.color,
    })
    .eq("id", cat.id);
  if (error) throw error;
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from("categorias_gasto").delete().eq("id", id);
  if (error) throw error;
}

// ─── Pagos de Deuda ───
export async function loadPagosDeuda(): Promise<PagoDeuda[]> {
  const { data, error } = await supabase
    .from("pagos_deudas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    deuda_id: row.deuda_id,
    monto: Number(row.monto),
    fecha: row.fecha,
    notas: row.notas,
    created_at: row.created_at,
  }));
}

export async function savePagoDeuda(pago: Omit<PagoDeuda, "id" | "user_id" | "created_at">, userId: string): Promise<PagoDeuda> {
  const { data, error } = await supabase
    .from("pagos_deudas")
    .insert({
      user_id: userId,
      deuda_id: pago.deuda_id,
      monto: pago.monto,
      fecha: pago.fecha,
      notas: pago.notas,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    monto: Number(data.monto)
  };
}

export async function updatePagoDeuda(pago: PagoDeuda): Promise<void> {
  const { error } = await supabase
    .from("pagos_deudas")
    .update({
      monto: pago.monto,
      fecha: pago.fecha,
      notas: pago.notas,
    })
    .eq("id", pago.id);
  if (error) throw error;
}

export async function deletePagoDeuda(id: string): Promise<void> {
  const { error } = await supabase.from("pagos_deudas").delete().eq("id", id);
  if (error) throw error;
}
