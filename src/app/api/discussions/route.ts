import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const discussions = await prisma.discussion.findMany({
    include: {
      personas: { include: { persona: true } },
      messages: { select: { id: true }, take: 0 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(discussions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, description, personaIds } = body as {
    title: string;
    description?: string;
    personaIds: string[];
  };

  if (!title || !personaIds?.length) {
    return NextResponse.json(
      { error: "Title and at least one persona are required" },
      { status: 400 }
    );
  }

  const discussion = await prisma.discussion.create({
    data: {
      title,
      description: description || null,
      personas: {
        create: personaIds.map((personaId, index) => ({
          personaId,
          turnOrder: index,
        })),
      },
    },
    include: {
      personas: { include: { persona: true } },
    },
  });

  return NextResponse.json(discussion);
}
