import { PatientCard } from "../ehr/PatientCard";

export default function PatientCardExample() {
  return (
    <div className="max-w-sm">
      <PatientCard
        id="1"
        nombre="María"
        apellidoPaterno="González"
        apellidoMaterno="López"
        curp="GOLM850315MDFRPN09"
        fechaNacimiento="1985-03-15"
        sexo="F"
        status="activo"
        alergias={["Penicilina", "Aspirina"]}
        onViewRecord={() => console.log("View record clicked")}
        onSchedule={() => console.log("Schedule clicked")}
      />
    </div>
  );
}
