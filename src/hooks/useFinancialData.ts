import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gasto, Deuda, Configuracion } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  loadGastos, saveGasto, updateGasto as updateGastoDb, deleteGasto as deleteGastoDb,
  loadDeudas, saveDeuda, updateDeuda as updateDeudaDb, deleteDeuda as deleteDeudaDb,
  loadConfiguracion, saveConfiguracion,
  loadCategorias, saveCategoria, updateCategoria as updateCategoriaDb, deleteCategoria as deleteCategoriaDb,
  loadPagosDeuda, savePagoDeuda, updatePagoDeuda as updatePagoDeudaDb, deletePagoDeuda as deletePagoDeudaDb,
  loadPresupuestos, savePresupuesto, deletePresupuesto as deletePresupuestoDb,
  loadIngresos, saveIngreso, updateIngreso as updateIngresoDb, deleteIngreso as deleteIngresoDb
} from "@/services/storage";
import {
  loadMetas, saveMeta, updateMeta as updateMetaDb, deleteMeta as deleteMetaDb,
} from "@/services/metasStorage";


const defaultConfig: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

export function useFinancialData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: gastos = [], isLoading: loadingGastos } = useQuery({
    queryKey: ["gastos", user?.id],
    queryFn: loadGastos,
    enabled: !!user,
  });

  const { data: deudas = [], isLoading: loadingDeudas } = useQuery({
    queryKey: ["deudas", user?.id],
    queryFn: loadDeudas,
    enabled: !!user,
  });

  const { data: config = defaultConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["configuracion", user?.id],
    queryFn: loadConfiguracion,
    enabled: !!user,
  });

  const { data: metas = [], isLoading: loadingMetas } = useQuery({
    queryKey: ["metas", user?.id],
    queryFn: loadMetas,
    enabled: !!user,
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ["categorias", user?.id],
    queryFn: loadCategorias,
    enabled: !!user,
  });

  const { data: pagosDeuda = [], isLoading: loadingPagos } = useQuery({
    queryKey: ["pagosDeuda", user?.id],
    queryFn: loadPagosDeuda,
    enabled: !!user,
  });

  const { data: presupuestos = [], isLoading: loadingPresupuestos } = useQuery({
    queryKey: ["presupuestos", user?.id],
    queryFn: loadPresupuestos,
    enabled: !!user,
  });

  const { data: ingresos = [], isLoading: loadingIngresos } = useQuery({
    queryKey: ["ingresos", user?.id],
    queryFn: loadIngresos,
    enabled: !!user,
  });

  // Gastos Mutations
  const addGasto = useMutation({
    mutationFn: async (gasto: Omit<Gasto, "id">) => {
      if (!user) throw new Error("No user");
      return saveGasto(gasto, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", user?.id] });
      toast.success("Gasto registrado");
    },
    onError: (err: Error) => toast.error("Error guardando gasto: " + err.message),
  }).mutateAsync;

  const updateGasto = useMutation({
    mutationFn: updateGastoDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", user?.id] });
      toast.success("Gasto actualizado");
    },
    onError: (err: Error) => toast.error("Error actualizando gasto: " + err.message),
  }).mutateAsync;

  const deleteGasto = useMutation({
    mutationFn: deleteGastoDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos", user?.id] });
      toast.success("Gasto eliminado");
    },
    onError: (err: Error) => toast.error("Error eliminando gasto: " + err.message),
  }).mutateAsync;

  // Deudas Mutations
  const addDeuda = useMutation({
    mutationFn: async (deuda: Omit<Deuda, "id">) => {
      if (!user) throw new Error("No user");
      return saveDeuda(deuda, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deudas", user?.id] });
      toast.success("Deuda registrada");
    },
    onError: (err: Error) => toast.error("Error guardando deuda: " + err.message),
  }).mutateAsync;

  const updateDeuda = useMutation({
    mutationFn: updateDeudaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deudas", user?.id] });
      toast.success("Deuda actualizada");
    },
    onError: (err: Error) => toast.error("Error actualizando deuda: " + err.message),
  }).mutateAsync;

  const deleteDeuda = useMutation({
    mutationFn: deleteDeudaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deudas", user?.id] });
      toast.success("Deuda eliminada");
    },
    onError: (err: Error) => toast.error("Error eliminando deuda: " + err.message),
  }).mutateAsync;

  // Metas Mutations
  const addMeta = useMutation({
    mutationFn: async (meta: Parameters<typeof saveMeta>[0]) => {
      if (!user) throw new Error("No user");
      return saveMeta(meta, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas", user?.id] });
      toast.success("Meta registrada");
    },
    onError: (err: Error) => toast.error("Error guardando meta: " + err.message),
  }).mutateAsync;

  const updateMeta = useMutation({
    mutationFn: updateMetaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas", user?.id] });
      toast.success("Meta actualizada");
    },
    onError: (err: Error) => toast.error("Error actualizando meta: " + err.message),
  }).mutateAsync;

  const deleteMeta = useMutation({
    mutationFn: deleteMetaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas", user?.id] });
      toast.success("Meta eliminada");
    },
    onError: (err: Error) => toast.error("Error eliminando meta: " + err.message),
  }).mutateAsync;

  // Categorías Mutations
  const addCategoria = useMutation({
    mutationFn: async (cat: Parameters<typeof saveCategoria>[0]) => {
      if (!user) throw new Error("No user");
      return saveCategoria(cat, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias", user?.id] });
      toast.success("Categoría creada");
    },
    onError: (err: Error) => toast.error("Error creando categoría: " + err.message),
  }).mutateAsync;

  const updateCategoria = useMutation({
    mutationFn: updateCategoriaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias", user?.id] });
      toast.success("Categoría actualizada");
    },
    onError: (err: Error) => toast.error("Error actualizando categoría: " + err.message),
  }).mutateAsync;

  const deleteCategoria = useMutation({
    mutationFn: deleteCategoriaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias", user?.id] });
      toast.success("Categoría eliminada");
    },
    onError: (err: Error) => toast.error("Error eliminando categoría: " + err.message),
  }).mutateAsync;

  // Pagos de Deuda Mutations
  const addPagoDeuda = useMutation({
    mutationFn: async (pago: Parameters<typeof savePagoDeuda>[0]) => {
      if (!user) throw new Error("No user");
      return savePagoDeuda(pago, user.id);
    },
    onSuccess: () => {
      // Invalidate both pagos and deudas (trigger affects deudas table)
      queryClient.invalidateQueries({ queryKey: ["pagosDeuda", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["deudas", user?.id] });
      toast.success("Pago registrado");
    },
    onError: (err: Error) => toast.error("Error registrando pago: " + err.message),
  }).mutateAsync;

  const updatePagoDeuda = useMutation({
    mutationFn: updatePagoDeudaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagosDeuda", user?.id] });
      toast.success("Pago actualizado");
    },
    onError: (err: Error) => toast.error("Error actualizando pago: " + err.message),
  }).mutateAsync;

  const deletePagoDeuda = useMutation({
    mutationFn: deletePagoDeudaDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagosDeuda", user?.id] });
      toast.success("Pago eliminado");
    },
    onError: (err: Error) => toast.error("Error eliminando pago: " + err.message),
  }).mutateAsync;

  // Presupuestos Mutations
  const addPresupuesto = useMutation({
    mutationFn: async (pres: Parameters<typeof savePresupuesto>[0]) => {
      if (!user) throw new Error("No user");
      return savePresupuesto(pres, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos", user?.id] });
      toast.success("Presupuesto actualizado");
    },
    onError: (err: Error) => toast.error("Error guardando presupuesto: " + err.message),
  }).mutateAsync;

  const deletePresupuesto = useMutation({
    mutationFn: deletePresupuestoDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos", user?.id] });
      toast.success("Presupuesto eliminado");
    },
    onError: (err: Error) => toast.error("Error eliminando presupuesto: " + err.message),
  }).mutateAsync;

  // Ingresos Mutations
  const addIngreso = useMutation({
    mutationFn: async (ing: Parameters<typeof saveIngreso>[0]) => {
      if (!user) throw new Error("No user");
      return saveIngreso(ing, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", user?.id] });
      toast.success("Ingreso registrado");
    },
    onError: (err: Error) => toast.error("Error guardando ingreso: " + err.message),
  }).mutateAsync;

  const updateIngreso = useMutation({
    mutationFn: updateIngresoDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", user?.id] });
      toast.success("Ingreso actualizado");
    },
    onError: (err: Error) => toast.error("Error actualizando ingreso: " + err.message),
  }).mutateAsync;

  const deleteIngreso = useMutation({
    mutationFn: deleteIngresoDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingresos", user?.id] });
      toast.success("Ingreso eliminado");
    },
    onError: (err: Error) => toast.error("Error eliminando ingreso: " + err.message),
  }).mutateAsync;

  const updateConfig = useMutation({
    mutationFn: async (newConfig: Configuracion) => {
      if (!user) throw new Error("No user");
      return saveConfiguracion(newConfig, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion", user?.id] });
    },
    onError: (err: Error) => toast.error("Error guardando configuración: " + err.message),
  }).mutateAsync;

  const loading = loadingGastos || loadingDeudas || loadingConfig || loadingMetas || loadingCategorias || loadingPagos;
  const configLoaded = config.id !== "default";

  return {
    gastos, addGasto, updateGasto, deleteGasto,
    deudas, addDeuda, updateDeuda, deleteDeuda,
    metas, addMeta, updateMeta, deleteMeta,
    categorias, addCategoria, updateCategoria, deleteCategoria,
    pagosDeuda, addPagoDeuda, updatePagoDeuda, deletePagoDeuda,
    presupuestos, addPresupuesto, deletePresupuesto,
    ingresos, addIngreso, updateIngreso, deleteIngreso,
    config, updateConfig,
    loading: loadingGastos || loadingDeudas || loadingConfig || loadingMetas || loadingCategorias || loadingPagos || loadingPresupuestos || loadingIngresos,
    configLoaded,
  };
}
