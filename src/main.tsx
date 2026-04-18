import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

// Interceptar y actualizar automáticamente
const updateSW = registerSW({
  onNeedRefresh() {
    toast("Nueva versión disponible", {
      description: "La aplicación se actualizará para mostrar las últimas mejoras.",
      action: {
        label: "Actualizar",
        onClick: () => updateSW(true),
      },
    });
  },
  onOfflineReady() {
    toast.success("Plata Clara lista", {
      description: "La aplicación ahora funciona sin conexión a internet.",
    });
  },
});

createRoot(document.getElementById("root")!).render(<App />);
