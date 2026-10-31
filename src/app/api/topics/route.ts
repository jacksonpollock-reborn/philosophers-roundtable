import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(topics);
}
