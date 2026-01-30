import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createNotification } from "@/lib/db";

/** Foydalanuvchi: adminga xabar yuborish (from_user=1). Email sessiondan, telefon formadan. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to send a message." }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { message, appointmentId, phone } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    const phoneStr = typeof phone === "string" && phone.trim() ? phone.trim() : "";
    const text = phoneStr ? `Phone: ${phoneStr}\n\n${String(message).trim()}` : String(message).trim();
    createNotification(
      session.user.email,
      text,
      appointmentId != null ? Number(appointmentId) : null,
      1
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("user-messages POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
