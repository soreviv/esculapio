import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
    nombre: string;
  }
}

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: "No autorizado. Por favor inicie sesión." });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
}

export function isMedico(req: Request, res: Response, next: NextFunction) {
  const role = req.session?.role;
  if (role === "medico" || role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de médico." });
}

export function isEnfermeria(req: Request, res: Response, next: NextFunction) {
  const role = req.session?.role;
  if (role === "enfermeria" || role === "medico" || role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de personal de salud." });
}

export function isMedicoOrEnfermeria(req: Request, res: Response, next: NextFunction) {
  const role = req.session?.role;
  if (role === "medico" || role === "enfermeria" || role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de personal de salud." });
}
