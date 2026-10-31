import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: {
      personas: {
        include: { persona: true },
        orderBy: { turnOrder: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });
  if (!discussion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(discussion);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.discussion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
