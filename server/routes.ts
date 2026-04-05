import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage, createTenantStorage, type TenantScopedStorage } from "./storage";
import {
  patientToFhir,
  userToPractitioner,
  medicalNoteToEncounter,
  vitalsToObservations,
  prescriptionToMedicationRequest,
  labOrderToServiceRequest,
  createPatientBundle,
  getCapabilityStatement,
} from "@shared/fhir-mappers";
import { 
  insertPatientSchema, 
  insertMedicalNoteSchema, 
  insertMedicalNoteAddendumSchema,
  insertVitalsSchema, 
  insertPrescriptionSchema, 
  insertAppointmentSchema,
  insertAuditLogSchema,
  insertCie10Schema,
  insertPatientConsentSchema
} from "@shared/schema";
import { createHash, randomUUID, randomBytes } from "crypto";
import { sendPasswordResetEmail } from "./mailer";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { encrypt, decrypt } from "./crypto";
import { hashPassword, verifyPassword, validatePasswordStrength, isAuthenticated, isAdmin, isMedico, isMedicoOrEnfermeria } from "./auth";
import { isTokenReplayed, markTokenUsed, getLockoutExpiry, recordFailure, clearFailures } from "./totp-guard";