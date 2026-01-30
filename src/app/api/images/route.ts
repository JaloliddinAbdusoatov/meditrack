import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readdirSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from "fs";
import path from "path";
import sharp from "sharp";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_WIDTH = 600;
const MAX_HEIGHT = 400;

function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
}

/** Public: landing va boshqa sahifalar rasmlar ro‘yxatini olishi uchun */
export async function GET() {
  ensureUploadsDir();
  try {
    const files = readdirSync(UPLOADS_DIR).filter(
      (f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    );
    const urls = files.map((f) => `/uploads/${f}`);
    return NextResponse.json({ images: urls });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ensureUploadsDir();
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buf)
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    writeFileSync(filePath, resized);
    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  if (!filename || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  try {
    unlinkSync(filePath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
