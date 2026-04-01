import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import { usePortalInfo } from "./PortalLayout";
import type { PortalPublicInfo } from "./PortalLayout";
import PortalLayout from "./PortalLayout";
import type { ClinicHoursDay } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  primera_vez: "Primera Vez",
  subsecuente: "Seguimiento",
  lavado_oidos: "Lavado de Oídos",
  urgencia: "Urgencia",
};

const DAY_MAP: Record<string, number> = {
  "Domingo": 0, "Lunes": 1, "Martes": 2, "Miércoles": 3,
  "Jueves": 4, "Viernes": 5, "Sábado": 6,
};

function useDisabledDay(info: PortalPublicInfo | undefined) {
  const horarios: ClinicHoursDay[] = info?.horarios ?? [];
  const activeDays = new Set(
    horarios.filter((h) => h.activo).map((h) => DAY_MAP[h.dia]).filter((n) => n !== undefined),
  );
  const holidays = new Set<string>(info?.diasFeriados ?? []);
  const maxDays = info?.bookingAdvanceDays ?? 30;

  return useCallback(
    (date: Date) => {
      if (activeDays.size > 0 && !activeDays.has(date.getDay())) return true;
      const iso = format(date, "yyyy-MM-dd");
      if (holidays.has(iso)) return true;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (date < now) return true;
      if (date > addDays(now, maxDays)) return true;
      return false;
    },
    [activeDays, holidays, maxDays],
  );
}

interface AppointmentToken {
  id: string;
  patientName: string;
  fecha: string;
  hora: string;
  appointmentType: string;
  status: string;
  patientConfirmed: boolean;
}

export default function PortalCitaReagendar() {
  const slug = usePortalSlug();
  const { data: info } = usePortalInfo();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const isDisabledDay = useDisabledDay(info);

  const { data: appointment, isLoading: loadingAppointment, isError } = useQuery<AppointmentToken>({
    queryKey: ["appointment-token", token],
    queryFn: () => portalFetch<AppointmentToken>(slug, `/appointments/by-token/${token}`),
    enabled: !!token,
    retry: false,
  });

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const result = await portalFetch<{ slots: string[] }>(slug, `/slots?fecha=${format(date, "yyyy-MM-dd")}`);
      setAvailableSlots(result.slots ?? []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (date) fetchSlots(date);
  };

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      portalFetch(slug, `/appointments/reschedule/${token}`, {
        method: "POST",
        body: JSON.stringify({
          fecha: format(selectedDate!, "yyyy-MM-dd"),
          hora: selectedTime,
        }),
      }),
    onSuccess: () => setRescheduled(true),
  });

  if (!token) {
    return (
      <PortalLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Enlace inválido</h2>
            <p className="text-slate-500 mb-6">No se encontró el token de reagendamiento.</p>
            <Link href={`/p/${slug}`}><Button variant="outline" className="w-full">Ir al inicio</Button></Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (loadingAppointment) {
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
            <p className="text-slate-500 mb-6">No es posible modificar una cita cancelada.</p>
            <Link href={`/p/${slug}/cita`}>
              <Button className="w-full">Agendar nueva cita</Button>
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (rescheduled) {
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
            <h2 className="text-2xl font-bold mb-2">¡Cita Reagendada!</h2>
            <p className="text-slate-600 mb-4">
              Su cita ha sido modificada exitosamente. Recibirá un nuevo correo de confirmación.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nueva fecha:</span>
                <span className="font-medium capitalize">
                  {format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nueva hora:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
            </div>
            <Link href={`/p/${slug}`}><Button variant="outline" className="w-full">Ir al inicio</Button></Link>
          </motion.div>
        </div>
      </PortalLayout>
    );
  }

  const currentDate = format(new Date(`${appointment.fecha}T00:00:00`), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <PortalLayout>
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3">Modificar Cita</h1>
            <p className="text-slate-600 text-sm">Selecciona la nueva fecha y hora para tu cita.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
              <p className="text-sm text-slate-500 mb-1">
                Cita actual de <strong>{appointment.patientName}</strong>:
              </p>
              <p className="font-medium capitalize">
                {currentDate} · {appointment.hora} · {TYPE_LABELS[appointment.appointmentType] ?? appointment.appointmentType}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            <div className="p-4 sm:p-6 md:p-8 bg-slate-50 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Nueva Fecha
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                className="rounded-md border bg-white mx-auto [--cell-size:2.5rem] sm:[--cell-size:2.75rem] md:[--cell-size:2rem]"
                disabled={isDisabledDay}
                initialFocus
              />
            </div>

            <div className="p-4 sm:p-6 md:p-8 md:w-2/3">
              <h3 className="font-bold text-lg mb-4">Nuevo Horario</h3>

              <div role="status" aria-live="polite">
                {!selectedDate ? (
                  <p className="text-sm text-slate-500">Selecciona una fecha para ver los horarios disponibles.</p>
                ) : loadingSlots ? (
                  <p className="text-sm text-slate-500">Cargando horarios...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay horarios disponibles para esta fecha.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={cn(
                          "text-center text-sm py-3 px-2 rounded-md border transition-all min-h-[44px]",
                          selectedTime === slot
                            ? "bg-primary text-white border-primary"
                            : "bg-white hover:border-primary border-slate-200",
                        )}
                        onClick={() => setSelectedTime(slot)}
                        aria-pressed={selectedTime === slot}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {rescheduleMutation.isError && (
                <p className="text-red-600 text-sm mt-4">
                  {(rescheduleMutation.error as Error)?.message || "Ocurrió un error. Intente de nuevo."}
                </p>
              )}

              <Button
                className="w-full mt-6"
                size="lg"
                disabled={!selectedDate || !selectedTime || rescheduleMutation.isPending}
                onClick={() => rescheduleMutation.mutate()}
              >
                {rescheduleMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Procesando...</>
                ) : (
                  "Confirmar nueva fecha"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
