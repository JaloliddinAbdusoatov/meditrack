import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "@/lib/db";
import type { Doctor } from "@/lib/data";

export async function GET() {
  try {
    const doctors = getDoctors();
    return NextResponse.json(doctors);
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
    const body = (await request.json()) as Doctor;
    const { id, name, specialization, education, bio, imageUrl } = body;
    if (!id || !name || !specialization || !education || !bio || !imageUrl) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    createDoctor({ id, name, specialization, education, bio, imageUrl });
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
    const body = (await request.json()) as Doctor;
    const { id, name, specialization, education, bio, imageUrl } = body;
    if (!id || !name || !specialization || !education || !bio || !imageUrl) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    updateDoctor({ id, name, specialization, education, bio, imageUrl });
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
    deleteDoctor(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
