import { MedicalNoteCard } from "../ehr/MedicalNoteCard";

export default function MedicalNoteCardExample() {
  return (
    <div className="max-w-md">
      <MedicalNoteCard
        id="1"
        tipo="nota_evolucion"
        fecha="15/12/2025"
        hora="10:30"
        medicoNombre="Dr. Roberto García"
        especialidad="Medicina Interna"
        motivoConsulta="Control de diabetes tipo 2"
        diagnosticos={["E11.9 DM Tipo 2", "I10 Hipertensión"]}
        firmada={true}
        onView={() => console.log("View note clicked")}
      />
    </div>
  );
}
