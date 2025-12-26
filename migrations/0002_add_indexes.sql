-- Add indexes on foreign keys for query optimization
-- This improves JOIN performance and WHERE clause lookups

-- Medical Notes indexes
CREATE INDEX IF NOT EXISTS idx_medical_notes_patient_id ON medical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_notes_medico_id ON medical_notes(medico_id);
CREATE INDEX IF NOT EXISTS idx_medical_notes_fecha ON medical_notes(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_medical_notes_tipo ON medical_notes(tipo);

-- Vitals indexes
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_fecha ON vitals(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_registrado_por ON vitals(registrado_por_id);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medico_id ON prescriptions(medico_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_medico_id ON appointments(medico_id);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha_medico ON appointments(fecha, medico_id);

-- Lab Orders indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_medico_id ON lab_orders(medico_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);

-- Nursing Notes indexes
CREATE INDEX IF NOT EXISTS idx_nursing_notes_patient_id ON nursing_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_enfermera_id ON nursing_notes(enfermera_id);
CREATE INDEX IF NOT EXISTS idx_nursing_notes_fecha ON nursing_notes(fecha DESC);

-- Audit Logs indexes (critical for compliance queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON audit_logs(entidad);
CREATE INDEX IF NOT EXISTS idx_audit_logs_fecha ON audit_logs(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad_id ON audit_logs(entidad_id);

-- Patient Consents indexes
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_tipo ON patient_consents(tipo_consentimiento);

-- Patients indexes for common searches
CREATE INDEX IF NOT EXISTS idx_patients_nombre ON patients(nombre);
CREATE INDEX IF NOT EXISTS idx_patients_apellido_paterno ON patients(apellido_paterno);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
