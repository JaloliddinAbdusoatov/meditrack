import Database from "better-sqlite3";
import path from "path";
import { mkdirSync, existsSync } from "fs";
import type { ClinicInfo, Service, Doctor } from "./data";
import type { UserRecord, Role } from "./auth-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "meditrack.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function getDb(): Database.Database {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      can_add_admins INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS clinic_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      education TEXT NOT NULL,
      bio TEXT NOT NULL,
      imageUrl TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferredDate TEXT NOT NULL,
      preferredTime TEXT NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      rescheduledDate TEXT,
      rescheduledTime TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      appointmentId INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      read INTEGER NOT NULL DEFAULT 0,
      from_user INTEGER NOT NULL DEFAULT 0
    );
  `);
  migrateAppointments(database);
  migrateUsersAndNotifications(database);
  seedIfEmpty(database);
}

function migrateAppointments(database: Database.Database) {
  const cols = ["status", "rescheduledDate", "rescheduledTime"];
  for (const col of cols) {
    try {
      if (col === "status") database.exec("ALTER TABLE appointments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
      else if (col === "rescheduledDate") database.exec("ALTER TABLE appointments ADD COLUMN rescheduledDate TEXT");
      else if (col === "rescheduledTime") database.exec("ALTER TABLE appointments ADD COLUMN rescheduledTime TEXT");
    } catch {
      // column exists
    }
  }
}

function migrateUsersAndNotifications(database: Database.Database) {
  try {
    database.exec("ALTER TABLE users ADD COLUMN can_add_admins INTEGER NOT NULL DEFAULT 0");
  } catch {
    // column exists
  }
  try {
    database.exec("ALTER TABLE notifications ADD COLUMN from_user INTEGER NOT NULL DEFAULT 0");
  } catch {
    // column exists
  }
}

function seedIfEmpty(database: Database.Database) {
  const clinicRow = database.prepare("SELECT id FROM clinic_info WHERE id = 1").get();
  if (!clinicRow) {
    database.prepare(
      "INSERT INTO clinic_info (id, name, address, phone, email, description) VALUES (1, ?, ?, ?, ?, ?)"
    ).run(
      "MediTrack Clinic",
      "123 Health St, Wellness City, 45678",
      "(123) 456-7890",
      "contact@meditrack.clinic",
      "Providing compassionate and comprehensive healthcare for our community. Our experienced team is dedicated to your well-being, offering a wide range of medical services in a modern and welcoming environment."
    );
  }
  const serviceCount = database.prepare("SELECT COUNT(*) as c FROM services").get() as { c: number };
  if (serviceCount.c === 0) {
    const insertService = database.prepare(
      "INSERT INTO services (id, name, description, icon) VALUES (?, ?, ?, ?)"
    );
    insertService.run("s1", "General Practice", "Comprehensive primary care for all ages, including routine check-ups, and managing chronic conditions.", "Stethoscope");
    insertService.run("s2", "Cardiology", "Specialized care for heart and blood vessel conditions, including diagnostics and treatment plans.", "HeartPulse");
    insertService.run("s3", "Diagnostics Lab", "Advanced laboratory services for accurate and timely diagnosis, using state-of-the-art equipment.", "Microscope");
    insertService.run("s4", "Orthopedics", "Treatment for injuries and diseases of your body's musculoskeletal system.", "Bone");
  }
  const doctorCount = database.prepare("SELECT COUNT(*) as c FROM doctors").get() as { c: number };
  if (doctorCount.c === 0) {
    const insertDoctor = database.prepare(
      "INSERT INTO doctors (id, name, specialization, education, bio, imageUrl) VALUES (?, ?, ?, ?, ?, ?)"
    );
    insertDoctor.run("d1", "Dr. Evelyn Reed", "Cardiologist", "MD from Stanford University", "Dr. Reed has over 15 years of experience in cardiology and is a leader in preventative heart care and advanced cardiac imaging.", "https://placehold.co/400x400");
    insertDoctor.run("d2", "Dr. Marcus Chen", "General Practitioner", "MD from Johns Hopkins University", "Dr. Chen is a dedicated family physician known for his compassionate approach and commitment to long-term patient relationships.", "https://placehold.co/400x400");
    insertDoctor.run("d3", "Dr. Sofia Garcia", "Orthopedic Surgeon", "MD from Harvard Medical School", "Dr. Garcia specializes in sports medicine and minimally invasive surgery, helping patients return to their active lifestyles.", "https://placehold.co/400x400");
  }
}

// --- Clinic ---
export function getClinicInfo(): ClinicInfo | null {
  const row = getDb().prepare("SELECT name, address, phone, email, description FROM clinic_info WHERE id = 1").get() as { name: string; address: string; phone: string; email: string; description: string } | undefined;
  return row ? { name: row.name, address: row.address, phone: row.phone, email: row.email, description: row.description } : null;
}

export function updateClinicInfo(info: ClinicInfo): void {
  getDb().prepare(
    "UPDATE clinic_info SET name = ?, address = ?, phone = ?, email = ?, description = ? WHERE id = 1"
  ).run(info.name, info.address, info.phone, info.email, info.description);
}

// --- Services ---
export function getServices(): Service[] {
  const rows = getDb().prepare("SELECT id, name, description, icon FROM services").all() as { id: string; name: string; description: string; icon: string }[];
  return rows.map((r) => ({ id: r.id, name: r.name, description: r.description, icon: r.icon as Service["icon"] }));
}

export function createService(service: Service): void {
  getDb().prepare("INSERT INTO services (id, name, description, icon) VALUES (?, ?, ?, ?)").run(service.id, service.name, service.description, service.icon);
}

export function updateService(service: Service): void {
  getDb().prepare("UPDATE services SET name = ?, description = ?, icon = ? WHERE id = ?").run(service.name, service.description, service.icon, service.id);
}

export function deleteService(id: string): void {
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
}

// --- Doctors ---
export function getDoctors(): Doctor[] {
  const rows = getDb().prepare("SELECT id, name, specialization, education, bio, imageUrl FROM doctors").all() as Doctor[];
  return rows;
}

export function createDoctor(doctor: Doctor): void {
  getDb().prepare("INSERT INTO doctors (id, name, specialization, education, bio, imageUrl) VALUES (?, ?, ?, ?, ?, ?)").run(doctor.id, doctor.name, doctor.specialization, doctor.education, doctor.bio, doctor.imageUrl);
}

export function updateDoctor(doctor: Doctor): void {
  getDb().prepare("UPDATE doctors SET name = ?, specialization = ?, education = ?, bio = ?, imageUrl = ? WHERE id = ?").run(doctor.name, doctor.specialization, doctor.education, doctor.bio, doctor.imageUrl, doctor.id);
}

export function deleteDoctor(id: string): void {
  getDb().prepare("DELETE FROM doctors WHERE id = ?").run(id);
}

// --- Appointments ---
export type AppointmentStatus = "pending" | "accepted" | "rejected";

export interface Appointment {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string | null;
  status: AppointmentStatus;
  rescheduledDate: string | null;
  rescheduledTime: string | null;
  createdAt: string;
}

export function getAppointments(): Appointment[] {
  const rows = getDb()
    .prepare(
      "SELECT id, name, email, phone, preferredDate, preferredTime, message, COALESCE(status,'pending') as status, rescheduledDate, rescheduledTime, createdAt FROM appointments ORDER BY createdAt DESC"
    )
    .all() as Appointment[];
  return rows;
}

export function getAppointmentsByEmail(email: string): Appointment[] {
  const rows = getDb()
    .prepare(
      "SELECT id, name, email, phone, preferredDate, preferredTime, message, COALESCE(status,'pending') as status, rescheduledDate, rescheduledTime, createdAt FROM appointments WHERE LOWER(email) = LOWER(?) ORDER BY createdAt DESC"
    )
    .all(email) as Appointment[];
  return rows;
}

export function createAppointment(data: Omit<Appointment, "id" | "createdAt" | "status" | "rescheduledDate" | "rescheduledTime">): void {
  getDb()
    .prepare(
      "INSERT INTO appointments (name, email, phone, preferredDate, preferredTime, message) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(data.name, data.email, data.phone, data.preferredDate, data.preferredTime, data.message ?? null);
}

export function updateAppointmentStatus(id: number, status: AppointmentStatus): void {
  getDb().prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
}

export function updateAppointmentReschedule(id: number, rescheduledDate: string, rescheduledTime: string): void {
  getDb().prepare("UPDATE appointments SET rescheduledDate = ?, rescheduledTime = ? WHERE id = ?").run(rescheduledDate, rescheduledTime, id);
}

// --- Notifications ---
export interface Notification {
  id: number;
  email: string;
  message: string;
  appointmentId: number | null;
  createdAt: string;
  read: number;
  from_user?: number;
}

export function getNotificationsByEmail(email: string): Notification[] {
  const rows = getDb()
    .prepare("SELECT id, email, message, appointmentId, createdAt, read, COALESCE(from_user,0) as from_user FROM notifications WHERE LOWER(email) = LOWER(?) AND COALESCE(from_user,0) = 0 ORDER BY createdAt DESC")
    .all(email) as Notification[];
  return rows;
}

export function createNotification(email: string, message: string, appointmentId: number | null = null, fromUser: number = 0): void {
  getDb().prepare("INSERT INTO notifications (email, message, appointmentId, from_user) VALUES (?, ?, ?, ?)").run(email, message, appointmentId, fromUser);
}

export function getNotificationsSentByAdmin(): Notification[] {
  const rows = getDb()
    .prepare("SELECT id, email, message, appointmentId, createdAt, read, COALESCE(from_user,0) as from_user FROM notifications WHERE COALESCE(from_user,0) = 0 ORDER BY createdAt DESC")
    .all() as Notification[];
  return rows;
}

export function getNotificationsFromUsers(): Notification[] {
  const rows = getDb()
    .prepare("SELECT id, email, message, appointmentId, createdAt, read, COALESCE(from_user,0) as from_user FROM notifications WHERE COALESCE(from_user,0) = 1 ORDER BY createdAt DESC")
    .all() as Notification[];
  return rows;
}

export function markNotificationRead(id: number): void {
  getDb().prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
}

// --- Users (for auth) ---
export function getUsersFromDb(): UserRecord[] {
  const rows = getDb().prepare("SELECT id, email, passwordHash, name, role, COALESCE(can_add_admins,0) as canAddAdmins FROM users").all() as (UserRecord & { canAddAdmins: number })[];
  return rows.map((r) => ({ ...r, canAddAdmins: r.canAddAdmins ?? 0 }));
}

export function getUserByEmailFromDb(email: string): UserRecord | null {
  const row = getDb().prepare("SELECT id, email, passwordHash, name, role, COALESCE(can_add_admins,0) as canAddAdmins FROM users WHERE LOWER(email) = LOWER(?)").get(email) as (UserRecord & { canAddAdmins?: number }) | undefined;
  if (!row) return null;
  return { ...row, canAddAdmins: row.canAddAdmins ?? 0 };
}

export function createUserInDb(user: UserRecord): void {
  const canAddAdmins = (user as UserRecord & { canAddAdmins?: number }).canAddAdmins ?? 0;
  getDb().prepare("INSERT INTO users (id, email, passwordHash, name, role, can_add_admins) VALUES (?, ?, ?, ?, ?, ?)").run(user.id, user.email, user.passwordHash, user.name, user.role, canAddAdmins);
}

export function updateUserInDb(id: string, updates: { email?: string; passwordHash?: string; name?: string; canAddAdmins?: number; role?: string }): void {
  const u = getUsersFromDb().find((r) => r.id === id);
  if (!u) return;
  const email = updates.email ?? (u as { email: string }).email;
  const passwordHash = updates.passwordHash ?? (u as { passwordHash: string }).passwordHash;
  const name = updates.name ?? (u as { name: string }).name;
  const canAddAdmins = updates.canAddAdmins ?? (u as UserRecord & { canAddAdmins?: number }).canAddAdmins ?? 0;
  const role = updates.role ?? (u as { role: string }).role;
  getDb().prepare("UPDATE users SET email = ?, passwordHash = ?, name = ?, can_add_admins = ?, role = ? WHERE id = ?").run(email, passwordHash, name, canAddAdmins, role, id);
}

export function deleteUserInDb(id: string): void {
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function getAdminsFromDb(): (UserRecord & { canAddAdmins: number })[] {
  const rows = getDb().prepare("SELECT id, email, passwordHash, name, role, COALESCE(can_add_admins,0) as canAddAdmins FROM users WHERE role = 'admin' ORDER BY can_add_admins DESC, email").all() as (UserRecord & { canAddAdmins: number })[];
  return rows;
}

export function userExistsByEmail(email: string): boolean {
  const row = getDb().prepare("SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)").get(email);
  return !!row;
}
