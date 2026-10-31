import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const personas = await prisma.persona.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(personas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, title, era, avatarColor, systemPrompt } = body as {
    name: string;
    title: string;
    era?: string;
    avatarColor: string;
    systemPrompt: string;
  };

  if (!name || !title || !systemPrompt) {
    return NextResponse.json(
      { error: "Name, title, and systemPrompt are required" },
      { status: 400 }
    );
  }

  const persona = await prisma.persona.create({
    data: {
      name,
      title,
      era: era || null,
      avatarColor: avatarColor || "#6366f1",
      systemPrompt,
      isDefault: false,
    },
  });

  return NextResponse.json(persona);
}
