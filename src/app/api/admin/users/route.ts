import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createUser } from "@/lib/users-store";
import { getAdminsFromDb } from "@/lib/db";

/** Faqat asosiy admin (canAddAdmins=1): barcha adminlar ro‘yxati */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canAddAdmins = (session.user as { canAddAdmins?: number }).canAddAdmins ?? 0;
  if (canAddAdmins !== 1) {
    return NextResponse.json({ error: "Only main admin can view admins list." }, { status: 403 });
  }
  try {
    const admins = getAdminsFromDb();
    return NextResponse.json(
      admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: a.role,
        canAddAdmins: a.canAddAdmins ?? 0,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Faqat asosiy admin (canAddAdmins=1): yangi admin qo‘shish; canAddAdmins 0 yoki 1 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canAddAdmins = (session.user as { canAddAdmins?: number }).canAddAdmins ?? 0;
  if (canAddAdmins !== 1) {
    return NextResponse.json({ error: "Only main admin can add new admins." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { email, password, name, canAddAdmins: newCanAddAdmins } = body;
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const canAdd = newCanAddAdmins === 1 ? 1 : 0;
    const result = createUser(email, password, name, "admin", canAdd);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      canAddAdmins: canAdd,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
