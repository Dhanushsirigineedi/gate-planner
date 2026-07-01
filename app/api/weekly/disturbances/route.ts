import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { weeklyPlanId, description, start, end, hrsLost } = body;

  if (!weeklyPlanId || !description || hrsLost === undefined) {
    return NextResponse.json(
      { error: "weeklyPlanId, description, hrsLost are required" },
      { status: 400 }
    );
  }

  const disturbance = await prisma.disturbance.create({
    data: {
      weeklyPlanId,
      description,
      start: new Date(start),
      end: new Date(end),
      hrsLost: Number(hrsLost),
    },
  });
  return NextResponse.json(disturbance, { status: 201 });
}
