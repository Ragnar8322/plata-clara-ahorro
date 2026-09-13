import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: ruta inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">Esta página no existe.</p>
        {/* Link en vez de <a href="/">: así no se recarga toda la aplicación. */}
        <Button asChild>
          <Link to="/">Volver al resumen</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
