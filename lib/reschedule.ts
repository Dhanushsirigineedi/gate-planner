import { PrismaClient, AllocationType, AllocationStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface RescheduleItem {
  topicId: string;
  topicName: string;
  type: AllocationType;
  allocated: number;
  completed: number;
  // positive delta = behind (push forward), negative = ahead (pull back)
  delta: number;
  sourceAllocationId: string;
}

// Step 1: call this to show the user the prompt. Nothing is written yet.
export async function previewWeekReschedule(weeklyPlanId: string): Promise<RescheduleItem[]> {
  const allocations = await prisma.weeklyAllocation.findMany({
    where: { weeklyPlanId, status: "OPEN" },
    include: { topic: true },
  });

  return allocations
    .map((a) => ({
      topicId: a.topicId,
      topicName: a.topic.name,
      type: a.type,
      allocated: a.hrsAllocated,
      completed: a.hrsCompleted,
      delta: a.hrsAllocated - a.hrsCompleted,
      sourceAllocationId: a.id,
    }))
    .filter((item) => item.delta !== 0); // only show topics that aren't exactly on target
}

// Step 2: called only after the user clicks "Reschedule" in the prompt.
// Behind (delta > 0): create/increase next week's allocation by the shortfall.
// Ahead (delta < 0): decrease next week's allocation by the surplus (floOred at 0).
export async function confirmWeekReschedule(
  weeklyPlanId: string,
  nextWeeklyPlanId: string,
  items: RescheduleItem[]
) {
  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      // close out this week's allocation
      await tx.weeklyAllocation.update({
        where: { id: item.sourceAllocationId },
        data: { status: AllocationStatus.RESCHEDULED },
      });

      // find or create next week's allocation for the same topic+type
      const existing = await tx.weeklyAllocation.findFirst({
        where: {
          weeklyPlanId: nextWeeklyPlanId,
          topicId: item.topicId,
          type: item.type,
          status: "OPEN",
        },
      });

      if (existing) {
        const adjusted = Math.max(0, existing.hrsAllocated + item.delta);
        await tx.weeklyAllocation.update({
          where: { id: existing.id },
          data: { hrsAllocated: adjusted },
        });
      } else if (item.delta > 0) {
        // only create a fresh row if there's a shortfall to push forward;
        // a pure surplus with nothing existing next week has nowhere to pull from
        await tx.weeklyAllocation.create({
          data: {
            weeklyPlanId: nextWeeklyPlanId,
            topicId: item.topicId,
            type: item.type,
            hrsAllocated: item.delta,
          },
        });
      }
    }
  });
}
