import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Printer, 
  User, 
  FileText, 
  ClipboardList, 
  Pill, 
  FlaskConical, 
  ScanLine,
  FileCheck,
  ChevronDown
} from "lucide-react";
import { 
  PrintDocuments,
  type PatientIdentificationData,
  type ClinicalHistoryData,
  type MedicalNoteData,
  type LabOrderData,
  type PrescriptionData,
  type ConsentData
} from "@/lib/print-documents";
import type {
  Patient,
  MedicalNote,
  Vitals,
  Prescription,
  LabOrder,
  PatientConsent,
  User as UserType,
  EstablishmentConfig
} from "@shared/schema";

interface PrintMenuProps {
  patient: Patient;
  medico?: Partial<UserType>;
}

export function PrintMenu({ patient, medico }: PrintMenuProps) {
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedConsentType, setSelectedConsentType] = useState<string>('');

  // Fetch patient data
  const { data: vitals } = useQuery<Vitals[]>({
    queryKey: [`/api/patients/${patient.id}/vitals`],
  });

  const { data: notes } = useQuery<(MedicalNote & { medicoNombre?: string; medicoEspecialidad?: string })[]>({
    queryKey: [`/api/patients/${patient.id}/notes`],
  });

  const { data: prescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patient.id}/prescriptions`],
  });

  const { data: establishment } = useQuery<EstablishmentConfig | null>({
    queryKey: ["/api/config/establishment"],
  });

  const { data: labOrders } = useQuery<LabOrder[]>({
    queryKey: [`/api/patients/${patient.id}/lab-orders`],
  });

  const { data: consents } = useQuery<PatientConsent[]>({
    queryKey: [`/api/patients/${patient.id}/consents`],
  });

  const latestVitals = vitals?.[0] || null;
  const activePrescriptions = prescriptions?.filter(p => p.status === 'activa') || [];

  // Print handlers
  const handlePrintIdentification = () => {
    PrintDocuments.patientIdentification({ patient, medico });
  };

  const handlePrintClinicalHistory = () => {
    PrintDocuments.clinicalHistory({ patient, medico, latestVitals });
  };

  const handlePrintNote = (note: MedicalNote & { medicoNombre?: string; medicoEspecialidad?: string }) => {
    const noteVitals = vitals?.find(v => {
      const noteDate = new Date(note.fecha).toDateString();
      const vitalsDate = new Date(v.fecha).toDateString();
      return noteDate === vitalsDate;
    });
    
    PrintDocuments.medicalNote({ 
      note: note as any, 
      patient, 
      vitals: noteVitals 
    });
  };

  const handlePrintLabOrder = (order: LabOrder, tipo: 'laboratorio' | 'gabinete' = 'laboratorio') => {
    PrintDocuments.labGabinetOrder({ 
      order: order as any, 
      patient,
      tipoEstudio: tipo
    });
  };

  const handlePrintPrescriptions = () => {
    if (activePrescriptions.length === 0) {
      alert('No hay recetas activas para imprimir');
      return;
    }
    PrintDocuments.prescription({
      prescriptions: activePrescriptions,
      patient,
      medico: medico || {},
      establishment: establishment ?? undefined,
    });
  };

  const handlePrintConsent = (tipo: string) => {
    const consent: PatientConsent = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      tipoConsentimiento: tipo,
      version: '1.0',
      aceptado: false,
      createdAt: new Date(),
      medicoId: null,
      procedimiento: null,
      riesgos: null,
      beneficios: null,
      alternativas: null,
      autorizaContingencias: true,
      nombreFirmante: null,
      parentescoRepresentante: null,
      nombreTestigo1: null,
      nombreTestigo2: null,
      fechaAceptacion: null,
      lugarFirma: null,
      ipAddress: null,
    };
    
    PrintDocuments.consent({ consent, patient, medico });
    setShowConsentDialog(false);
  };

  const consentTypes = [
    { value: 'privacidad', label: 'Aviso de Privacidad (LFPDPPP)' },
    { value: 'atencion_consulta', label: 'Consentimiento para Consulta' },
    { value: 'procedimiento', label: 'Consentimiento para Procedimiento' },
    { value: 'expediente_electronico', label: 'Consentimiento ECE (NOM-024)' },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-testid="print-menu-button">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Documentos del Paciente</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Identificación */}
          <DropdownMenuItem onClick={handlePrintIdentification} data-testid="print-identification">
            <User className="h-4 w-4 mr-2" />
            Hoja de Identificación
          </DropdownMenuItem>

          {/* Historia Clínica */}
          <DropdownMenuItem onClick={handlePrintClinicalHistory} data-testid="print-clinical-history">
            <FileText className="h-4 w-4 mr-2" />
            Historia Clínica
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Notas Médicas</DropdownMenuLabel>

          {/* Notas Médicas */}
          {notes && notes.length > 0 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ClipboardList className="h-4 w-4 mr-2" />
                Notas Clínicas ({notes.length})
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                {notes.slice(0, 10).map((note) => (
                  <DropdownMenuItem 
                    key={note.id} 
                    onClick={() => handlePrintNote(note)}
                    data-testid={`print-note-${note.id}`}
                  >
                    <span className="truncate">
                      {new Date(note.fecha).toLocaleDateString('es-MX')} - {note.tipo.replace(/_/g, ' ')}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem disabled>
              <ClipboardList className="h-4 w-4 mr-2 opacity-50" />
              Sin notas registradas
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Solicitudes y Recetas</DropdownMenuLabel>

          {/* Recetas */}
          <DropdownMenuItem 
            onClick={handlePrintPrescriptions}
            disabled={activePrescriptions.length === 0}
            data-testid="print-prescriptions"
          >
            <Pill className="h-4 w-4 mr-2" />
            Receta Médica ({activePrescriptions.length} activas)
          </DropdownMenuItem>

          {/* Órdenes de Laboratorio */}
          {labOrders && labOrders.length > 0 ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FlaskConical className="h-4 w-4 mr-2" />
                Órdenes de Laboratorio ({labOrders.length})
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {labOrders.slice(0, 5).map((order) => (
                  <DropdownMenuItem 
                    key={order.id} 
                    onClick={() => handlePrintLabOrder(order, 'laboratorio')}
                    data-testid={`print-lab-${order.id}`}
                  >
                    <span className="truncate">
                      {new Date(order.createdAt!).toLocaleDateString('es-MX')} - {order.estudios.length} estudios
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem disabled>
              <FlaskConical className="h-4 w-4 mr-2 opacity-50" />
              Sin órdenes de laboratorio
            </DropdownMenuItem>
          )}

          {/* Órdenes de Gabinete (usa mismas órdenes pero imprime diferente) */}
          {labOrders && labOrders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ScanLine className="h-4 w-4 mr-2" />
                Órdenes de Gabinete
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {labOrders.slice(0, 5).map((order) => (
                  <DropdownMenuItem 
                    key={order.id} 
                    onClick={() => handlePrintLabOrder(order, 'gabinete')}
                    data-testid={`print-gabinete-${order.id}`}
                  >
                    <span className="truncate">
                      {new Date(order.createdAt!).toLocaleDateString('es-MX')} - {order.estudios.length} estudios
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Consentimientos</DropdownMenuLabel>

          {/* Consentimientos */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileCheck className="h-4 w-4 mr-2" />
              Consentimiento Informado
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {consentTypes.map((type) => (
                <DropdownMenuItem 
                  key={type.value}
                  onClick={() => handlePrintConsent(type.value)}
                  data-testid={`print-consent-${type.value}`}
                >
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Consentimientos existentes */}
          {consents && consents.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileCheck className="h-4 w-4 mr-2" />
                Consentimientos Firmados ({consents.length})
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {consents.map((consent) => (
                  <DropdownMenuItem 
                    key={consent.id}
                    onClick={() => PrintDocuments.consent({ consent, patient, medico })}
                    data-testid={`print-signed-consent-${consent.id}`}
                  >
                    <span className="truncate">
                      {consent.tipoConsentimiento.replace(/_/g, ' ')} - 
                      {consent.fechaAceptacion ? new Date(consent.fechaAceptacion).toLocaleDateString('es-MX') : 'Pendiente'}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default PrintMenu;
