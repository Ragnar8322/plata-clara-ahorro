import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gasto, Deuda, Configuracion } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  loadGastos, saveGasto, updateGasto as updateGastoDb, deleteGasto as deleteGastoDb,
  loadDeudas, saveDeuda, updateDeuda as updateDeudaDb, deleteDeuda as deleteDeudaDb,
  loadConfiguracion, saveConfiguracion,
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
    mutationFn: async (meta: Omit<MetaAhorro, "id" | "user_id" | "created_at" | "updated_at">) => {
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

  // Config Mutations
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

  const loading = loadingGastos || loadingDeudas || loadingConfig || loadingMetas;
  const configLoaded = config.id !== "default";

  return {
    gastos, addGasto, updateGasto, deleteGasto,
    deudas, addDeuda, updateDeuda, deleteDeuda,
    metas, addMeta, updateMeta, deleteMeta,
    config, updateConfig,
    loading, configLoaded,
  };
}
