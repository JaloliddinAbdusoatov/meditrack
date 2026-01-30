import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUser, deleteUser, getUserById } from "@/lib/users-store";
import type { Role } from "@/lib/auth-types";

const MAIN_ADMIN_EMAIL = "admin@meditrack.clinic";

/** Faqat asosiy admin: boshqa foydalanuvchi/admin roli yoki canAddAdmins ni o‘zgartirish */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canAddAdmins = (session.user as { canAddAdmins?: number }).canAddAdmins ?? 0;
  if (canAddAdmins !== 1) {
    return NextResponse.json({ error: "Only main admin can change users." }, { status: 403 });
  }
  const id = (await params).id;
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const target = getUserById(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if ((target as { email?: string }).email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Cannot change main admin role." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { role, canAddAdmins: newCanAddAdmins } = body;
    const updates: { role?: Role; canAddAdmins?: number } = {};
    if (role === "user" || role === "admin") updates.role = role;
    if (newCanAddAdmins === 0 || newCanAddAdmins === 1) updates.canAddAdmins = newCanAddAdmins;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Provide role or canAddAdmins to update." }, { status: 400 });
    }
    const result = updateUser(id, updates);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      canAddAdmins: (result as { canAddAdmins?: number }).canAddAdmins ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Faqat asosiy admin: boshqa admin/foydalanuvchini o‘chirish (o‘zini o‘chirish mumkin emas) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canAddAdmins = (session.user as { canAddAdmins?: number }).canAddAdmins ?? 0;
  if (canAddAdmins !== 1) {
    return NextResponse.json({ error: "Only main admin can delete users." }, { status: 403 });
  }
  const id = (await params).id;
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (session.user.id === id) {
    return NextResponse.json({ error: "Cannot delete yourself." }, { status: 403 });
  }
  const result = deleteUser(id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
