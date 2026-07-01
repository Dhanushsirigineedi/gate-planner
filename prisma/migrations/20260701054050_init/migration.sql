-- CreateEnum
CREATE TYPE "AllocationType" AS ENUM ('LECTURE', 'PYQ', 'REVISION');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('OPEN', 'DONE', 'RESCHEDULED');

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "speedFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "examDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lectureHrs" DOUBLE PRECISION NOT NULL,
    "pyqHrs" DOUBLE PRECISION NOT NULL,
    "revisionHrs" DOUBLE PRECISION NOT NULL,
    "lectureHrsDone" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pyqHrsDone" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revisionHrsDone" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "nominatedHrs" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disturbance" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "hrsLost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Disturbance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyAllocation" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "type" "AllocationType" NOT NULL,
    "hrsAllocated" DOUBLE PRECISION NOT NULL,
    "hrsCompleted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "AllocationStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "WeeklyAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateBlock" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,

    CONSTRAINT "TemplateBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBlock" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "weeklyAllocationId" TEXT,
    "templateBlockId" TEXT,
    "isTemplateOverride" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DailyBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicProgress" (
    "id" TEXT NOT NULL,
    "dailyBlockId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hrsLogged" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_subjectId_idx" ON "Topic"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlan_weekStart_key" ON "WeeklyPlan"("weekStart");

-- CreateIndex
CREATE INDEX "WeeklyAllocation_weeklyPlanId_idx" ON "WeeklyAllocation"("weeklyPlanId");

-- CreateIndex
CREATE INDEX "WeeklyAllocation_topicId_idx" ON "WeeklyAllocation"("topicId");

-- CreateIndex
CREATE INDEX "DailyBlock_date_idx" ON "DailyBlock"("date");

-- CreateIndex
CREATE INDEX "TopicProgress_dailyBlockId_idx" ON "TopicProgress"("dailyBlockId");

-- CreateIndex
CREATE INDEX "TopicProgress_topicId_idx" ON "TopicProgress"("topicId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disturbance" ADD CONSTRAINT "Disturbance_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAllocation" ADD CONSTRAINT "WeeklyAllocation_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyAllocation" ADD CONSTRAINT "WeeklyAllocation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBlock" ADD CONSTRAINT "DailyBlock_weeklyAllocationId_fkey" FOREIGN KEY ("weeklyAllocationId") REFERENCES "WeeklyAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyBlock" ADD CONSTRAINT "DailyBlock_templateBlockId_fkey" FOREIGN KEY ("templateBlockId") REFERENCES "TemplateBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicProgress" ADD CONSTRAINT "TopicProgress_dailyBlockId_fkey" FOREIGN KEY ("dailyBlockId") REFERENCES "DailyBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
