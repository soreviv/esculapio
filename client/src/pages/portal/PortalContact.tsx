import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { usePortalSlug, portalFetch } from "./usePortalApi";
import { usePortalInfo } from "./PortalLayout";
import PortalLayout from "./PortalLayout";

declare global {
  interface Window { google: any; }
}

const contactSchema = z.object({
  name:            z.string().min(2, "Nombre requerido"),
  email:           z.string().email("Email inválido"),
  phone:           z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    const digits = val.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 12 && digits.startsWith("52"));
  }, "Ingresa un número de teléfono válido (10 dígitos)"),
  subject:         z.string().min(5, "Asunto requerido"),
  message:         z.string().min(10, "Mensaje muy corto"),
  privacyAccepted: z.boolean().refine((v) => v === true, { message: "Debe aceptar el aviso de privacidad" }),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function PortalContact() {
  const slug = usePortalSlug();
  const { data: info } = usePortalInfo();
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);

  const domicilio = info?.domicilio ?? "Chosica 730, Lindavista";
  const ciudad    = info?.ciudad ?? "Ciudad de México";
  const telefono  = info?.telefono ?? "";
  const email     = info?.notificationEmail ?? "contacto@otorrinonet.com";

  // Load Google Maps dynamically
  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); initMap(); return; }
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => { setMapLoaded(true); initMap(); });
      return;
    }
    // Only load if API key is configured
    const MAPS_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!MAPS_KEY) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => { setMapLoaded(true); initMap(); };
    document.head.appendChild(script);
  }, []);

  const initMap = () => {
    const location = { lat: 19.4932, lng: -99.1353 }; // Chosica 730, Lindavista
    const mapEl = document.getElementById("portal-map");
    if (!mapEl || !window.google?.maps) return;
    const map = new window.google.maps.Map(mapEl, {
      zoom: 16, center: location, mapTypeControl: false, streetViewControl: false,
    });
    new window.google.maps.Marker({ position: location, map, title: "Consultorio" });
  };

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "", privacyAccepted: false },
  });

  const onSubmit = async (values: ContactForm) => {
    try {
      await portalFetch(slug, "/contact", {
        method: "POST",
        body: JSON.stringify({
          name:    values.name,
          email:   values.email,
          phone:   values.phone || undefined,
          subject: values.subject,
          message: values.message,
        }),
      });
      toast({ title: "Mensaje enviado", description: "Nos pondremos en contacto contigo pronto." });
      form.reset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo enviar el mensaje", variant: "destructive" });
    }
  };

  return (
    <PortalLayout>
      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-display font-bold text-center mb-12">Contáctanos</h1>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Información de Contacto</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold">Ubicación</h4>
                      <p className="text-slate-600">{domicilio}<br />{ciudad}</p>
                    </div>
                  </div>
                  {telefono && (
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h4 className="font-bold">Teléfono</h4>
                        <a href={`tel:${telefono}`} className="text-slate-600 hover:text-primary transition-colors">
                          {telefono}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold">Email</h4>
                      <a href={`mailto:${email}`} className="text-slate-600 hover:text-primary transition-colors">
                        {email}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Ubicación en el Mapa</CardTitle></CardHeader>
                <CardContent>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(domicilio + " " + ciudad)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline mb-2"
                  >
                    Abrir en Google Maps
                  </a>
                  {mapLoaded ? (
                    <div id="portal-map" className="w-full h-[300px] rounded-lg" />
                  ) : (
                    <div className="w-full h-[300px] rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                      {domicilio}, {ciudad}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Urgencias Médicas</h3>
                <p className="mb-4">Si presentas una emergencia médica grave, acude al hospital más cercano o llama a emergencias.</p>
                <p className="font-bold text-lg">Teléfono de Urgencias: 911</p>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Envíanos un Mensaje</CardTitle></CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl><Input placeholder="Tu nombre" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl><Input placeholder="tucorreo@ejemplo.com" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
                        <FormControl><Input placeholder="(55) 1234-5678" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto *</FormLabel>
                        <FormControl><Input placeholder="Motivo del mensaje" aria-required="true" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Escribe tu mensaje aquí..." className="min-h-[120px]" aria-required="true" {...field} />
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
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Enviando..." : "Enviar Mensaje"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
