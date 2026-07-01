import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.hrsAllocated !== undefined) data.hrsAllocated = Number(body.hrsAllocated);
  if (body.hrsCompleted !== undefined) data.hrsCompleted = Number(body.hrsCompleted);
  if (body.status !== undefined) data.status = body.status;

  const allocation = await prisma.weeklyAllocation.update({
    where: { id: params.id },
    data,
    include: { topic: { include: { subject: true } } },
  });
  return NextResponse.json(allocation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.weeklyAllocation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
