import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAppointments,
  updateAppointmentStatus,
  updateAppointmentReschedule,
} from "@/lib/db";
import type { AppointmentStatus } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { status: appointmentStatus, rescheduledDate, rescheduledTime } = body;

    if (appointmentStatus !== undefined) {
      const valid: AppointmentStatus[] = ["pending", "accepted", "rejected"];
      if (!valid.includes(appointmentStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateAppointmentStatus(id, appointmentStatus);
    }

    if (rescheduledDate !== undefined && rescheduledTime !== undefined) {
      updateAppointmentReschedule(id, String(rescheduledDate), String(rescheduledTime));
    }

    const appointments = getAppointments();
    const updated = appointments.find((a) => a.id === id);
    return NextResponse.json(updated ?? { ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
