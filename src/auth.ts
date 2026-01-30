import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role, UserRecord } from "@/lib/auth-types";

export const { handlers, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { getUserByEmail, verifyPassword } = await import("@/lib/users-store");
        const user = getUserByEmail(credentials.email as string);
        if (!user || !verifyPassword(credentials.password as string, user.passwordHash))
          return null;
        const u = user as UserRecord & { canAddAdmins?: number };
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          canAddAdmins: u.canAddAdmins ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.canAddAdmins = (user as { canAddAdmins?: number }).canAddAdmins ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as Role;
        session.user.canAddAdmins = (token.canAddAdmins as number) ?? 0;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  debug: process.env.NODE_ENV === "development",
});
