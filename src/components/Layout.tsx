import { ReactNode, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, CreditCard, TrendingDown, Settings, LogOut, Target, PiggyBank, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import ReportarPagoDialog from "@/components/deudas/ReportarPagoDialog";
import { Deuda, PagoDeuda } from "@/types";

const navItems = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/deudas", label: "Deudas", icon: CreditCard },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/proyeccion", label: "Proyección", icon: TrendingDown },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

interface Props {
  children: ReactNode;
  deudas?: Deuda[];
  onAddPago?: (p: Omit<PagoDeuda, "id" | "user_id" | "created_at">) => Promise<any>;
}

export default function Layout({ children, deudas = [], onAddPago }: Props) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const deudasActivas = deudas.filter((d) => d.activa);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PiggyBank className="h-5 w-5" />
            </span>
            Plata Clara
          </h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/reporte', '_blank')} 
              className="gap-1.5 hidden sm:flex border-primary/20 hover:bg-primary/5"
            >
              <TrendingDown className="h-4 w-4 text-primary" />
              <span>Reporte</span>
            </Button>
            <span className="text-xs text-muted-foreground hidden lg:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>

      {deudasActivas.length > 0 && (
        <Button
          onClick={() => setPagoDialogOpen(true)}
          title="Registrar pago"
          className="fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-emerald-600 p-0 text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-transform"
        >
          <DollarSign className="h-8 w-8" strokeWidth={2.5} />
        </Button>
      )}

      <ReportarPagoDialog
        open={pagoDialogOpen}
        onOpenChange={setPagoDialogOpen}
        deudas={deudasActivas}
        onSubmit={onAddPago}
      />
    </div>
  );
}
