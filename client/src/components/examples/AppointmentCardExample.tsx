import { AppointmentCard } from "../ehr/AppointmentCard";

export default function AppointmentCardExample() {
  return (
    <div className="max-w-sm">
      <AppointmentCard
        id="1"
        pacienteNombre="Juan Pérez Ramírez"
        hora="09:00"
        duracion="30 min"
        motivo="Consulta de seguimiento"
        status="pendiente"
        onStartConsult={() => console.log("Start consult clicked")}
        onViewPatient={() => console.log("View patient clicked")}
      />
    </div>
  );
}
