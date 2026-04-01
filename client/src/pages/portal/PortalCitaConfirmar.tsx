import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import PortalLayout from "./PortalLayout";

type State = "loading" | "success" | "already" | "error";

export default function PortalCitaConfirmar() {
  const slug = usePortalSlug();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    if (!token) {
      setErrorMsg("No se encontró el token de confirmación.");
      setState("error");
      return;
    }
    portalFetch<{ ok: boolean; alreadyConfirmed?: boolean }>(
      slug,
      `/appointments/confirm?token=${token}`,
    )
      .then((data) => {
        setState(data.alreadyConfirmed ? "already" : "success");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message || "El enlace no es válido o ya expiró.");
        setState("error");
      });
  }, [slug, token]);

  if (state === "loading") {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (state === "error") {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No se pudo confirmar</h2>
            <p className="text-slate-500 mb-6">{errorMsg}</p>
            <Link href={`/p/${slug}`}>
              <Button variant="outline" className="w-full">Ir al inicio</Button>
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center"
          role="alert"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {state === "already" ? "Cita ya confirmada" : "¡Cita Confirmada!"}
          </h2>
          <p className="text-slate-600 mb-6">
            {state === "already"
              ? "Su cita ya había sido confirmada anteriormente. Le esperamos en el consultorio."
              : "Hemos registrado su confirmación. Le esperamos puntualmente en el consultorio."}
          </p>
          <Link href={`/p/${slug}`}>
            <Button variant="outline" className="w-full">Volver al inicio</Button>
          </Link>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
