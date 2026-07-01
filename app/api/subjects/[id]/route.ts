import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const subject = await prisma.subject.update({
    where: { id: params.id },
    data: { name: body.name },
  });
  return NextResponse.json(subject);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // topics cascade is not set in schema by default relation, so delete topics first
  await prisma.topic.deleteMany({ where: { subjectId: params.id } });
  await prisma.subject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
