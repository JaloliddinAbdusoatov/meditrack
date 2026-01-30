import bcrypt from "bcryptjs";
import type { UserRecord, Role } from "./auth-types";
import {
  getUsersFromDb,
  getUserByEmailFromDb,
  createUserInDb,
  updateUserInDb,
  deleteUserInDb,
  userExistsByEmail,
} from "./db";

const MAIN_ADMIN_EMAIL = "admin@meditrack.clinic";
const MAIN_ADMIN_PASSWORD = "klinikaadmin5292973";

export function getUsers(): UserRecord[] {
  const users = getUsersFromDb();
  if (users.length === 0) {
    const hash = bcrypt.hashSync(MAIN_ADMIN_PASSWORD, 10);
    const defaultAdmin: UserRecord & { canAddAdmins?: number } = {
      id: "admin-1",
      email: MAIN_ADMIN_EMAIL,
      passwordHash: hash,
      name: "Admin",
      role: "admin",
      canAddAdmins: 1,
    };
    createUserInDb(defaultAdmin);
    return getUsersFromDb();
  }
  const mainAdmin = users.find((u) => (u as UserRecord & { canAddAdmins?: number }).email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase());
  if (mainAdmin && (mainAdmin as UserRecord & { canAddAdmins?: number }).canAddAdmins !== 1) {
    const hash = bcrypt.hashSync(MAIN_ADMIN_PASSWORD, 10);
    updateUserInDb(mainAdmin.id, { passwordHash: hash, canAddAdmins: 1 });
    return getUsersFromDb();
  }
  return users;
}

export function getUserByEmail(email: string): UserRecord | null {
  getUsers();
  return getUserByEmailFromDb(email);
}

export function getUserById(id: string): UserRecord | null {
  const users = getUsersFromDb();
  return users.find((u) => u.id === id) ?? null;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function createUser(
  email: string,
  password: string,
  name: string,
  role: Role = "user",
  canAddAdmins: number = 0
): UserRecord | { error: string } {
  if (userExistsByEmail(email)) {
    return { error: "User with this email already exists" };
  }
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser: UserRecord & { canAddAdmins?: number } = { id, email, passwordHash, name, role, canAddAdmins };
  createUserInDb(newUser);
  return newUser;
}

export function updateUser(
  id: string,
  updates: { email?: string; password?: string; name?: string; canAddAdmins?: number; role?: Role }
): UserRecord | { error: string } {
  const user = getUserById(id);
  if (!user) return { error: "User not found" };
  if (updates.email != null && updates.email !== user.email && userExistsByEmail(updates.email)) {
    return { error: "User with this email already exists" };
  }
  if (updates.role != null && updates.role !== "user" && updates.role !== "admin") {
    return { error: "Invalid role" };
  }
  const out: { email?: string; passwordHash?: string; name?: string; canAddAdmins?: number; role?: string } = {};
  if (updates.email != null) out.email = updates.email;
  if (updates.password != null) out.passwordHash = bcrypt.hashSync(updates.password, 10);
  if (updates.name != null) out.name = updates.name;
  if (updates.canAddAdmins != null) out.canAddAdmins = updates.canAddAdmins;
  if (updates.role != null) {
    out.role = updates.role;
    if (updates.role === "user") out.canAddAdmins = 0;
  }
  updateUserInDb(id, out);
  return getUserById(id) ?? user;
}

export function deleteUser(id: string): { error?: string } {
  const user = getUserById(id);
  if (!user) return { error: "User not found" };
  if ((user as { email?: string }).email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
    return { error: "Cannot delete main admin" };
  }
  deleteUserInDb(id);
  return {};
}
