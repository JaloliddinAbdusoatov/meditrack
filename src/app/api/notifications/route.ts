import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getNotificationsByEmail,
  createNotification,
  getNotificationsSentByAdmin,
  getNotificationsFromUsers,
} from "@/lib/db";

/** Admin: mijozga xabar yuborish (from_user=0) */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { email, message, appointmentId } = body;
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }
    createNotification(
      String(email).trim(),
      String(message).trim(),
      appointmentId != null ? Number(appointmentId) : null,
      0
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Admin: yuborilgan xabarlar (?sent=1) yoki foydalanuvchilardan kelgan xabarlar (?from_users=1). User: o‘z xabarlari. */
export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const sent = searchParams.get("sent") === "1";
  const fromUsers = searchParams.get("from_users") === "1";

  if (session?.user?.role === "admin" && sent) {
    try {
      const notifications = getNotificationsSentByAdmin();
      return NextResponse.json(notifications);
    } catch {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
  if (session?.user?.role === "admin" && fromUsers) {
    try {
      const notifications = getNotificationsFromUsers();
      return NextResponse.json(notifications);
    } catch {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Log in to view your notifications." },
      { status: 401 }
    );
  }
  const queryEmail = searchParams.get("email")?.trim();
  const email = queryEmail && queryEmail.toLowerCase() === session.user.email.toLowerCase()
    ? queryEmail
    : session.user.email;
  try {
    const notifications = getNotificationsByEmail(email);
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
