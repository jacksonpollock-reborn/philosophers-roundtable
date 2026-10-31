import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const persona = await prisma.persona.findUnique({ where: { id } });
  if (!persona) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(persona);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const persona = await prisma.persona.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(persona);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const persona = await prisma.persona.findUnique({ where: { id } });
  if (!persona) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (persona.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete default personas" },
      { status: 400 }
    );
  }
  await prisma.persona.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
