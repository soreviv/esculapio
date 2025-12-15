import { VitalsDisplay, VitalSign } from "../ehr/VitalsDisplay";

export default function VitalsDisplayExample() {
  const vitals: VitalSign[] = [
    { label: "Presión Arterial", value: "120/80", unit: "mmHg", icon: "heart", status: "normal" },
    { label: "Frecuencia Cardíaca", value: 72, unit: "lpm", icon: "activity", status: "normal" },
    { label: "Temperatura", value: 36.5, unit: "°C", icon: "thermometer", status: "normal" },
    { label: "Saturación O2", value: 98, unit: "%", icon: "droplets", status: "normal" },
    { label: "Frecuencia Resp.", value: 16, unit: "rpm", icon: "wind", status: "normal" },
    { label: "Peso", value: 70.5, unit: "kg", icon: "scale", status: "normal" },
  ];

  return (
    <div className="max-w-2xl">
      <VitalsDisplay vitals={vitals} fechaRegistro="15/12/2025 09:30" />
    </div>
  );
}
