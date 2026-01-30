import { NextResponse } from "next/server";
import { createUser } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password and name are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    const result = createUser(email, password, name, "user");
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
