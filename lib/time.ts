// The ONLY place lecture-time <-> real-time conversion happens.
// Everywhere else in the app, LECTURE allocations are lecture-time,
// and PYQ/REVISION allocations are already real-time.

import { AllocationType } from "@prisma/client";

// Single global speed factor, per user's decision (no per-topic override).
export const DEFAULT_SPEED_FACTOR = 1.5;


export function lectureToReal(lectureHrs: number, speedFactor: number): number {
  return lectureHrs / speedFactor;
}

export function realToLecture(realHrs: number, speedFactor: number): number {
  return realHrs * speedFactor;
}

// Converts an allocation's remaining hours into the real-clock duration
// it should occupy on the daily grid. Only LECTURE type gets divided by
// the speed factor; PYQ/REVISION pass through unchanged.
export function allocationRealDuration(
  type: AllocationType,
  hrs: number,
  speedFactor: number
): number {
  if (type === "LECTURE") return lectureToReal(hrs, speedFactor);
  return hrs;
}

export function remainingHrs(allocated: number, completed: number): number {
  return Math.max(0, allocated - completed);
}
