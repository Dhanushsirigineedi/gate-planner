import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Only accept known editable fields; numeric fields get coerced.
  if (body.name !== undefined) data.name = body.name;
  if (body.lectureHrs !== undefined) data.lectureHrs = Number(body.lectureHrs);
  if (body.pyqHrs !== undefined) data.pyqHrs = Number(body.pyqHrs);
  if (body.revisionHrs !== undefined) data.revisionHrs = Number(body.revisionHrs);
  if (body.lectureHrsDone !== undefined) data.lectureHrsDone = Number(body.lectureHrsDone);
  if (body.pyqHrsDone !== undefined) data.pyqHrsDone = Number(body.pyqHrsDone);
  if (body.revisionHrsDone !== undefined) data.revisionHrsDone = Number(body.revisionHrsDone);

  const topic = await prisma.topic.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(topic);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.topic.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
