import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import { usePortalInfo } from "./PortalLayout";
import type { PortalPublicInfo } from "./PortalLayout";
import PortalLayout from "./PortalLayout";
import type { ClinicHoursDay } from "@shared/schema";

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

function formatHorarios(info: PortalPublicInfo | undefined): React.ReactNode {
  const horarios = info?.horarios;
  if (!horarios || horarios.length === 0) return <p>Lun–Vie: 16:00–19:00 / Jue–Vie: 10:00–13:00</p>;
  return horarios
    .filter((h) => h.activo)
    .map((h, i) => <p key={i}>{h.dia}: {h.inicio} – {h.fin}</p>);
}

const formSchema = z.object({
  name:            z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone:           z.string().refine((val) => {
    const digits = val.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 12 && digits.startsWith("52"));
  }, "Ingresa un número de teléfono válido (10 dígitos)"),
  email:           z.string().email("Ingresa un correo electrónico válido"),
  type:            z.enum(["primera_vez", "subsecuente", "urgencia", "lavado_oidos"], {
    error: "Selecciona el tipo de consulta",
  }),
  reason:          z.string().min(10, "Por favor describe brevemente el motivo de la consulta"),
  date:            z.date({ error: "Selecciona una fecha" }),
  time:            z.string().min(1, "Selecciona una hora"),
  privacyAccepted: z.boolean().refine((v) => v === true, { message: "Debe aceptar el aviso de privacidad" }),
});

type AppointmentForm = z.infer<typeof formSchema>;

export default function PortalAppointment() {
  const slug = usePortalSlug();
  const { data: info } = usePortalInfo();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isDisabledDay = useDisabledDay(info);

  const { data: slotsData, refetch: _refetch } = useQuery<{ slots: string[] }>({
    queryKey: ["portal-slots", slug, selectedDate ? format(selectedDate, "yyyy-MM-dd") : null],
    queryFn: () => {
      if (!selectedDate) return { slots: [] };
      return portalFetch<{ slots: string[] }>(slug, `/slots?fecha=${format(selectedDate, "yyyy-MM-dd")}`);
    },
    enabled: false,
  });

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const result = await portalFetch<{ slots: string[] }>(slug, `/slots?fecha=${dateStr}`);
      setAvailableSlots(result.slots ?? []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "primera_vez", name: "", phone: "", email: "", reason: "", privacyAccepted: false, time: "" },
  });

  const onDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue("date", date);
      form.setValue("time", "");
      fetchSlots(date);
    }
  };

  const onSubmit = async (values: AppointmentForm) => {
    try {
      await portalFetch(slug, "/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientName:     values.name,
          patientPhone:    values.phone,
          patientEmail:    values.email,
          appointmentType: values.type,
          motivo:          values.reason,
          fecha:           format(values.date, "yyyy-MM-dd"),
          hora:            values.time,
        }),
      });
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo agendar la cita", variant: "destructive" });
    }
  };

  if (isSubmitted) {
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
            <h2 className="text-2xl font-bold mb-2">¡Cita Agendada!</h2>
            <p className="text-slate-600 mb-6">
              Hemos registrado tu cita correctamente. Te hemos enviado un correo de confirmación con los detalles.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-medium">{format(form.getValues("date"), "PPP", { locale: es })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hora:</span>
                <span className="font-medium">{form.getValues("time")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-medium capitalize">{form.getValues("type").replace(/_/g, " ")}</span>
              </div>
            </div>
            <Link href={`/p/${slug}`}>
              <Button variant="outline" className="w-full">Volver al Inicio</Button>
            </Link>
          </motion.div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3 md:mb-4">Agendar Cita</h1>
            <p className="text-sm sm:text-base text-slate-600">Selecciona la fecha y hora que mejor se adapte a tu horario.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            {/* Calendar sidebar */}
            <div className="p-4 sm:p-6 md:p-6 bg-slate-50 md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Selecciona Fecha
                </h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  className="rounded-md border bg-white mx-auto"
                  disabled={isDisabledDay}
                  initialFocus
                />
              </div>
              <div className="text-sm text-slate-500">
                <p className="font-medium mb-1">Horarios de atención:</p>
                {formatHorarios(info)}
                <p className="mt-1 text-xs">Feriados: Cerrado</p>
              </div>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6 md:p-8 md:w-7/12">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl><Input placeholder="Juan Pérez" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl><Input placeholder="(555) 123-4567" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl><Input placeholder="juan@ejemplo.com" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Consulta *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger aria-required="true">
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primera_vez">Primera Vez</SelectItem>
                            <SelectItem value="subsecuente">Subsecuente / Seguimiento</SelectItem>
                            <SelectItem value="lavado_oidos">Lavado de Oídos</SelectItem>
                            <SelectItem value="urgencia">Urgencia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario Disponible *</FormLabel>
                      <div role="status" aria-live="polite">
                        {!selectedDate ? (
                          <p className="text-sm text-slate-500 mt-2">Selecciona una fecha para ver los horarios disponibles</p>
                        ) : loadingSlots ? (
                          <p className="text-sm text-slate-500 mt-2">Cargando horarios...</p>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-sm text-slate-500 mt-2">No hay horarios disponibles para esta fecha</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                            {availableSlots.map((slot) => (
                              <button
                                type="button"
                                key={slot}
                                className={cn(
                                  "text-center text-sm py-3 sm:py-2 px-2 sm:px-1 rounded-md border transition-all min-h-[44px]",
                                  field.value === slot
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white hover:border-primary border-slate-200",
                                )}
                                onClick={() => field.onChange(slot)}
                                aria-pressed={field.value === slot}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de la consulta *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe brevemente tus síntomas..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="privacyAccepted" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          He leído y acepto el{" "}
                          <Link href={`/p/${slug}/privacidad`} className="text-primary underline hover:text-primary/80">
                            Aviso de Privacidad
                          </Link>{" "}
                          *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />

                  <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Procesando..." : "Confirmar Cita"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
