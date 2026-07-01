import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allocationRealDuration, DEFAULT_SPEED_FACTOR } from "@/lib/time";

// date: "YYYY-MM-DD", startTime: "HH:mm" (24h)
function combine(date: string, time: string): Date {
  return new Date(`${date}T${time}:00.000Z`);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Case 1: hide a recurring template for a single date
  if (body.mode === "template-override") {
    const { date, templateBlockId } = body;
    if (!date || !templateBlockId) {
      return NextResponse.json(
        { error: "date and templateBlockId are required" },
        { status: 400 }
      );
    }
    const template = await prisma.templateBlock.findUnique({ where: { id: templateBlockId } });
    if (!template) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }
    const block = await prisma.dailyBlock.create({
      data: {
        date: new Date(date + "T00:00:00.000Z"),
        start: combine(date, template.start),
        end: combine(date, template.end),
        templateBlockId,
        isTemplateOverride: true,
      },
    });
    return NextResponse.json(block, { status: 201 });
  }

  // Case 2: schedule (part of) an allocation onto the grid
  const { date, startTime, weeklyAllocationId, hrsForBlock } = body;
  if (!date || !startTime || !weeklyAllocationId || !hrsForBlock) {
    return NextResponse.json(
      { error: "date, startTime, weeklyAllocationId, hrsForBlock are required" },
      { status: 400 }
    );
  }

  const allocation = await prisma.weeklyAllocation.findUnique({
    where: { id: weeklyAllocationId },
  });
  if (!allocation) {
    return NextResponse.json({ error: "allocation not found" }, { status: 404 });
  }

  const realDurationHrs = allocationRealDuration(
    allocation.type,
    Number(hrsForBlock),
    DEFAULT_SPEED_FACTOR
  );

  const start = combine(date, startTime);
  const end = new Date(start.getTime() + realDurationHrs * 60 * 60 * 1000);

  const block = await prisma.dailyBlock.create({
    data: {
      date: new Date(date + "T00:00:00.000Z"),
      start,
      end,
      weeklyAllocationId,
    },
    include: {
      weeklyAllocation: { include: { topic: { include: { subject: true } } } },
    },
  });

  return NextResponse.json(block, { status: 201 });
}
