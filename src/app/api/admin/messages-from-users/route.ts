import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotificationsFromUsers } from "@/lib/db";

/** Admin: foydalanuvchilardan kelgan xabarlar (from_user=1) */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const notifications = getNotificationsFromUsers();
    return NextResponse.json(notifications);
  } catch (e) {
    console.error("messages-from-users", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
