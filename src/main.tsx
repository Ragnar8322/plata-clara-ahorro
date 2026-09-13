import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

const updateSW = registerSW({
  onNeedRefresh() {
    // El aviso no caduca: recargar en medio de un formulario perdería lo escrito, así que la
    // decisión es del usuario.
    toast("Nueva versión disponible", {
      description: "Recarga cuando termines lo que estás haciendo.",
      duration: Infinity,
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
