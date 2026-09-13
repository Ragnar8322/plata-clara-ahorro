import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, cualquier excepción al renderizar (una gráfica con datos inesperados, un campo nulo)
 * deja la aplicación en blanco, sin mensaje ni forma de salir salvo recargar a ciegas.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Error no controlado en la interfaz:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-bold tracking-tight">Algo se rompió en esta pantalla</h1>
          <p className="text-sm text-muted-foreground">
            Tus datos están guardados y no se perdió nada. Puedes recargar para continuar; si vuelve
            a ocurrir, evita esta pantalla por ahora.
          </p>
          <p className="max-w-full overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      </div>
    );
  }
}
