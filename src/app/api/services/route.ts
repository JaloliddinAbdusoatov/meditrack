import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getServices, createService, updateService, deleteService } from "@/lib/db";
import type { Service } from "@/lib/data";

export async function GET() {
  try {
    const services = getServices();
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Service;
    const { id, name, description, icon } = body;
    if (!id || !name || !description || !icon) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    createService({ id, name, description, icon });
    return NextResponse.json({ ok: true });
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
    const body = (await request.json()) as Service;
    const { id, name, description, icon } = body;
    if (!id || !name || !description || !icon) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    updateService({ id, name, description, icon });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    deleteService(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
