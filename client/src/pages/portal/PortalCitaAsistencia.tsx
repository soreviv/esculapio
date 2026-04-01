import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import PortalLayout from "./PortalLayout";

const TYPE_LABELS: Record<string, string> = {
  primera_vez: "Primera Vez",
  subsecuente: "Seguimiento",
  lavado_oidos: "Lavado de Oídos",
  urgencia: "Urgencia",
};

interface AppointmentToken {
  id: string;
  patientName: string;
  fecha: string;
  hora: string;
  appointmentType: string;
  status: string;
  patientConfirmed: boolean;
}

export default function PortalCitaAsistencia() {
  const slug = usePortalSlug();
  const [confirmed, setConfirmed] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const { data: appointment, isLoading, isError } = useQuery<AppointmentToken>({
    queryKey: ["appointment-token", token],
    queryFn: () => portalFetch<AppointmentToken>(slug, `/appointments/by-token/${token}`),
    enabled: !!token,
    retry: false,
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      portalFetch<{ alreadyConfirmed: boolean }>(slug, `/appointments/confirm-attendance/${token}`, { method: "POST" }),
    onSuccess: (data) => {
      setAlreadyConfirmed(data.alreadyConfirmed);
      setConfirmed(true);
    },
  });

  if (!token) {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Enlace inválido</h2>
            <p className="text-slate-500 mb-6">No se encontró el token de confirmación.</p>
            <Link href={`/p/${slug}`}><Button variant="outline" className="w-full">Ir al inicio</Button></Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (isError || !appointment) {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Cita no encontrada</h2>
            <p className="text-slate-500 mb-6">El enlace no es válido o ya expiró.</p>
            <Link href={`/p/${slug}`}><Button variant="outline" className="w-full">Ir al inicio</Button></Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (appointment.status === "cancelada") {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Cita Cancelada</h2>
            <p className="text-slate-500 mb-6">Esta cita fue cancelada y no es posible confirmar asistencia.</p>
            <Link href={`/p/${slug}/cita`}>
              <Button className="w-full">Agendar nueva cita</Button>
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (confirmed) {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {alreadyConfirmed ? "Asistencia ya confirmada" : "¡Asistencia Confirmada!"}
            </h2>
            <p className="text-slate-600 mb-6">
              {alreadyConfirmed
                ? "Ya había confirmado su asistencia a esta cita anteriormente."
                : "Gracias por confirmar. Le esperamos puntualmente."}
            </p>
            <Link href={`/p/${slug}`}><Button variant="outline" className="w-full">Ir al inicio</Button></Link>
          </motion.div>
        </div>
      </PortalLayout>
    );
  }

  const formattedDate = format(new Date(`${appointment.fecha}T00:00:00`), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <PortalLayout>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Confirmar Asistencia</h2>
          <p className="text-slate-500 text-center mb-6">
            Confirme que asistirá a la siguiente cita:
          </p>

          <div className="bg-slate-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Paciente:</span>
              <span className="font-medium">{appointment.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha:</span>
              <span className="font-medium capitalize">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hora:</span>
              <span className="font-medium">{appointment.hora}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo:</span>
              <span className="font-medium">{TYPE_LABELS[appointment.appointmentType] ?? appointment.appointmentType}</span>
            </div>
          </div>

          {confirmMutation.isError && (
            <p className="text-red-600 text-sm text-center mb-4">
              {(confirmMutation.error as Error)?.message || "Ocurrió un error. Intente de nuevo."}
            </p>
          )}

          <Button
            className="w-full"
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
          >
            {confirmMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Confirmando...</>
            ) : (
              "Confirmar mi asistencia"
            )}
          </Button>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
