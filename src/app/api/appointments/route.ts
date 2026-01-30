import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppointments, createAppointment } from "@/lib/db";

/** Band qilish: faqat kirgan foydalanuvchi, email sessiondan */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please log in to book an appointment." },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();
    const { name, phone, preferredDate, preferredTime, message } = body;
    if (!name || !phone || !preferredDate || !preferredTime) {
      return NextResponse.json(
        { error: "Name, phone, date and time are required" },
        { status: 400 }
      );
    }
    createAppointment({
      name: String(name).trim(),
      email: session.user.email,
      phone: String(phone).trim(),
      preferredDate: String(preferredDate),
      preferredTime: String(preferredTime),
      message: message ? String(message).trim() : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Admin: barcha band qilishlar (faqat admin panel uchun) */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const appointments = getAppointments();
    return NextResponse.json(appointments);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
