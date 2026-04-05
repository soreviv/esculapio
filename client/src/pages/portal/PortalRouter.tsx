import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

const PortalHome           = lazy(() => import("./PortalHome"));
const PortalAppointment    = lazy(() => import("./PortalAppointment"));
const PortalContact        = lazy(() => import("./PortalContact"));
const PortalServices       = lazy(() => import("./PortalServices"));
const PortalPrivacy        = lazy(() => import("./PortalPrivacy"));
const PortalTerms          = lazy(() => import("./PortalTerms"));
const PortalCitaCancelar   = lazy(() => import("./PortalCitaCancelar"));
const PortalCitaReagendar  = lazy(() => import("./PortalCitaReagendar"));
const PortalCitaConfirmar  = lazy(() => import("./PortalCitaConfirmar"));
const PortalCitaAsistencia = lazy(() => import("./PortalCitaAsistencia"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export default function PortalRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Domain-root routes: otorrinonet.com/cita, otorrinonet.com/, etc. */}
          <Route path="/cita/cancelar"   component={PortalCitaCancelar} />
          <Route path="/cita/reagendar"  component={PortalCitaReagendar} />
          <Route path="/cita/confirmar"  component={PortalCitaConfirmar} />
          <Route path="/cita/asistencia" component={PortalCitaAsistencia} />
          <Route path="/cita"            component={PortalAppointment} />
          <Route path="/contacto"        component={PortalContact} />
          <Route path="/servicios"       component={PortalServices} />
          <Route path="/privacidad"      component={PortalPrivacy} />
          <Route path="/terminos"        component={PortalTerms} />
          {/* Legacy slug routes: /p/:slug/* — backwards compat & dev environment */}
          <Route path="/p/:slug/cita/cancelar"   component={PortalCitaCancelar} />
          <Route path="/p/:slug/cita/reagendar"  component={PortalCitaReagendar} />
          <Route path="/p/:slug/cita/confirmar"  component={PortalCitaConfirmar} />
          <Route path="/p/:slug/cita/asistencia" component={PortalCitaAsistencia} />
          <Route path="/p/:slug/cita"            component={PortalAppointment} />
          <Route path="/p/:slug/contacto"        component={PortalContact} />
          <Route path="/p/:slug/servicios"       component={PortalServices} />
          <Route path="/p/:slug/privacidad"      component={PortalPrivacy} />
          <Route path="/p/:slug/terminos"        component={PortalTerms} />
          <Route path="/p/:slug"                 component={PortalHome} />
          <Route path="/p/:slug/"                component={PortalHome} />
          <Route path="/"                        component={PortalHome} />
        </Switch>
      </Suspense>
      <Toaster />
    </QueryClientProvider>
  );
}
