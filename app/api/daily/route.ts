import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  const startDate = new Date(start + "T00:00:00.000Z");
  const endDate = new Date(end + "T23:59:59.999Z");

  const [templates, dailyBlocks] = await Promise.all([
    prisma.templateBlock.findMany(),
    prisma.dailyBlock.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        weeklyAllocation: { include: { topic: { include: { subject: true } } } },
        templateBlock: true,
      },
      orderBy: { start: "asc" },
    }),
  ]);

  return NextResponse.json({ templates, dailyBlocks });
}
