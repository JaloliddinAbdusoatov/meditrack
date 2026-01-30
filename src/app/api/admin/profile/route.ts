import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUser } from "@/lib/users-store";

/** Faqat asosiy admin (canAddAdmins=1): o‘z email va parolini o‘zgartirish */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canAddAdmins = (session.user as { canAddAdmins?: number }).canAddAdmins ?? 0;
  if (canAddAdmins !== 1) {
    return NextResponse.json({ error: "Only main admin can change profile." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { email, password, name } = body;
    const updates: { email?: string; password?: string; name?: string } = {};
    if (typeof email === "string" && email.trim()) updates.email = email.trim();
    if (typeof password === "string" && password.length >= 6) updates.password = password;
    if (typeof name === "string" && name.trim()) updates.name = name.trim();
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Provide email, password or name to update." }, { status: 400 });
    }
    const result = updateUser(session.user.id, updates);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
