import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Remove any date-specific overrides referencing this template first.
  await prisma.dailyBlock.deleteMany({ where: { templateBlockId: params.id } });
  await prisma.templateBlock.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
