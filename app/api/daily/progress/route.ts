import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { dailyBlockId, hrsLogged } = body;
  if (!dailyBlockId || hrsLogged === undefined) {
    return NextResponse.json(
      { error: "dailyBlockId and hrsLogged are required" },
      { status: 400 }
    );
  }
  const hrs = Number(hrsLogged);
  if (!hrs || hrs <= 0) {
    return NextResponse.json({ error: "hrsLogged must be positive" }, { status: 400 });
  }

  const block = await prisma.dailyBlock.findUnique({
    where: { id: dailyBlockId },
    include: { weeklyAllocation: true },
  });
  if (!block || !block.weeklyAllocation) {
    return NextResponse.json(
      { error: "block not found or has no linked allocation (templates can't log progress)" },
      { status: 404 }
    );
  }

  const allocation = block.weeklyAllocation;
  const doneField =
    allocation.type === "LECTURE"
      ? "lectureHrsDone"
      : allocation.type === "PYQ"
      ? "pyqHrsDone"
      : "revisionHrsDone";

  const result = await prisma.$transaction(async (tx) => {
    const progress = await tx.topicProgress.create({
      data: { dailyBlockId, topicId: allocation.topicId, hrsLogged: hrs },
    });

    await tx.topic.update({
      where: { id: allocation.topicId },
      data: { [doneField]: { increment: hrs } },
    });

    const updatedAllocation = await tx.weeklyAllocation.update({
      where: { id: allocation.id },
      data: { hrsCompleted: { increment: hrs } },
    });

    return { progress, updatedAllocation };
  });

  return NextResponse.json(result, { status: 201 });
}
