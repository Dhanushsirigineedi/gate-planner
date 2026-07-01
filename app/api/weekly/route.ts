import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mondayOf } from "@/lib/week";

export async function GET(req: NextRequest) {
  const weekStartParam = req.nextUrl.searchParams.get("weekStart");
  if (!weekStartParam) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  }
  const weekStart = mondayOf(new Date(weekStartParam));

  let plan = await prisma.weeklyPlan.findUnique({
    where: { weekStart },
    include: {
      disturbances: true,
      allocations: { include: { topic: { include: { subject: true } } } },
    },
  });

  if (!plan) {
    plan = await prisma.weeklyPlan.create({
      data: { weekStart, nominatedHrs: 0 },
      include: {
        disturbances: true,
        allocations: { include: { topic: { include: { subject: true } } } },
      },
    });
  }

  return NextResponse.json(plan);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const plan = await prisma.weeklyPlan.update({
    where: { id: body.id },
    data: { nominatedHrs: Number(body.nominatedHrs) },
  });
  return NextResponse.json(plan);
}
