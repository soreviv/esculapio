import { PrescriptionCard } from "../ehr/PrescriptionCard";

export default function PrescriptionCardExample() {
  return (
    <div className="max-w-md">
      <PrescriptionCard
        medicamento="Metformina"
        presentacion="Tabletas 850mg"
        dosis="1 tableta"
        via="Oral"
        frecuencia="Cada 12 horas"
        duracion="30 días"
        indicaciones="Tomar con alimentos. Evitar alcohol."
        status="activa"
      />
    </div>
  );
}
