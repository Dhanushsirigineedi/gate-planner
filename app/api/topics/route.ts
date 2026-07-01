import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subjectId, name, lectureHrs, pyqHrs, revisionHrs } = body;

  if (!subjectId || !name) {
    return NextResponse.json(
      { error: "subjectId and name are required" },
      { status: 400 }
    );
  }

  const topic = await prisma.topic.create({
    data: {
      subjectId,
      name,
      lectureHrs: Number(lectureHrs) || 0,
      pyqHrs: Number(pyqHrs) || 0,
      revisionHrs: Number(revisionHrs) || 0,
    },
  });
  return NextResponse.json(topic, { status: 201 });
}
