import { Configuracion } from "@/types";

export function formatMoney(amount: number, config: Configuracion): string {
  return `${config.monedaSimbolo} ${amount.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
