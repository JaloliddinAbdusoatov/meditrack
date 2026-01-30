import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotificationsByEmail, markNotificationRead } from "@/lib/db";

/** Xabarni o‘qilgan deb belgilash (email query yoki session bo‘yicha tekshiriladi) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  let email = searchParams.get("email");
  if (!email) {
    const session = await auth();
    if (session?.user?.email) email = session.user.email;
  }
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  try {
    const notifications = getNotificationsByEmail(email);
    const notification = notifications.find((n) => n.id === id);
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    markNotificationRead(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
