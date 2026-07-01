import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { weeklyPlanId, topicId, type, hrsAllocated } = body;

  if (!weeklyPlanId || !topicId || !type || hrsAllocated === undefined) {
    return NextResponse.json(
      { error: "weeklyPlanId, topicId, type, hrsAllocated are required" },
      { status: 400 }
    );
  }

  const allocation = await prisma.weeklyAllocation.create({
    data: {
      weeklyPlanId,
      topicId,
      type,
      hrsAllocated: Number(hrsAllocated),
    },
    include: { topic: { include: { subject: true } } },
  });
  return NextResponse.json(allocation, { status: 201 });
}
