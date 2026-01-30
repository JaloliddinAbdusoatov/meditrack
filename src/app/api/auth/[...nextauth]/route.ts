import { NextResponse } from "next/server";
import { handlers } from "@/auth";

async function ensureJsonResponse(
  handler: (req: Request) => Promise<Response>,
  req: Request
): Promise<Response> {
  try {
    const res = await handler(req);
    if (res.status >= 500) {
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return NextResponse.json(
          { error: "Authentication error" },
          { status: res.status }
        );
      }
    }
    return res;
  } catch (err) {
    console.error("[auth]", err);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return ensureJsonResponse(handlers.GET, req);
}

export async function POST(req: Request) {
  return ensureJsonResponse(handlers.POST, req);
}
