import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.templateBlock.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { start: "asc" }],
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { dayOfWeek, title, start, end } = body;
  if (dayOfWeek === undefined || !title || !start || !end) {
    return NextResponse.json(
      { error: "dayOfWeek, title, start, end are required" },
      { status: 400 }
    );
  }
  const template = await prisma.templateBlock.create({
    data: { dayOfWeek: Number(dayOfWeek), title, start, end },
  });
  return NextResponse.json(template, { status: 201 });
}
