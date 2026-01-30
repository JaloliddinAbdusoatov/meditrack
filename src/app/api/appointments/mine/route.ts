import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppointmentsByEmail } from "@/lib/db";

/** Foydalanuvchi: faqat o‘z band qilishlari (kirgan foydalanuvchi, admin ham o‘zini ko‘radi) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to view your appointments." }, { status: 401 });
  }
  try {
    const appointments = getAppointmentsByEmail(session.user.email);
    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
