import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getClinicInfo, updateClinicInfo } from "@/lib/db";
import type { ClinicInfo } from "@/lib/data";

export async function GET() {
  try {
    const info = getClinicInfo();
    return NextResponse.json(info ?? {});
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as ClinicInfo;
    const { name, address, phone, email, description } = body;
    if (!name || !address || !phone || !email || !description) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    updateClinicInfo({ name, address, phone, email, description });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
