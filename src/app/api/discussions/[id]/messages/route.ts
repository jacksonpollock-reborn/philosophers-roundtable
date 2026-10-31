import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const messages = await prisma.message.findMany({
    where: { discussionId: id },
    include: { persona: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { content } = body as { content: string };

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const discussion = await prisma.discussion.findUniqueOrThrow({
    where: { id },
  });

  const message = await prisma.message.create({
    data: {
      discussionId: id,
      personaId: null,
      content: content.trim(),
      round: discussion.totalRounds,
    },
    include: { persona: true },
  });

  return NextResponse.json(message);
}
