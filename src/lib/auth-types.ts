export type Role = "user" | "admin";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  canAddAdmins?: number;
}

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    canAddAdmins?: number;
  }
  interface Session {
    user: User & { role: Role; canAddAdmins?: number };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    canAddAdmins?: number;
  }
}
