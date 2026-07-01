"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mondayOf, addDays, toDateParam, weekLabel } from "@/lib/week";

const GRID_START_HOUR = 6;
const GRID_END_HOUR = 23;
const HOUR_HEIGHT = 32; // px
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type AllocType = "LECTURE" | "PYQ" | "REVISION";

type Allocation = {
  id: string;
  type: AllocType;
  hrsAllocated: number;
  hrsCompleted: number;
  topic: { id: string; name: string; subject: { name: string } };
};

type TemplateBlock = { id: string; dayOfWeek: number; title: string; start: string; end: string };

type DailyBlock = {
  id: string;
  date: string;
  start: string;
  end: string;
  isTemplateOverride: boolean;
  weeklyAllocationId: string | null;
  templateBlockId: string | null;
  weeklyAllocation?: {
    id: string;
    type: AllocType;
    topic: { name: string; subject: { name: string } };
  } | null;
  templateBlock?: TemplateBlock | null;
};

const TYPE_COLOR: Record<AllocType, string> = {
  LECTURE: "bg-rose-500",
  PYQ: "bg-green-600",
  REVISION: "bg-pink-500",
};

function minutesSinceGridStart(iso: string): number {
  const d = new Date(iso);
  return (d.getUTCHours() - GRID_START_HOUR) * 60 + d.getUTCMinutes();
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default function DailyPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [templates, setTemplates] = useState<TemplateBlock[]>([]);
  const [blocks, setBlocks] = useState<DailyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tForm, setTForm] = useState({ title: "", dayOfWeek: "1", start: "07:00", end: "08:00" });

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = days[6];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, weeklyRes] = await Promise.all([
        fetch(`/api/daily?start=${toDateParam(weekStart)}&end=${toDateParam(weekEnd)}`),
        fetch(`/api/weekly?weekStart=${toDateParam(weekStart)}`),
      ]);
      if (!dailyRes.ok) throw new Error(`Daily fetch failed: ${dailyRes.status}`);
      if (!weeklyRes.ok) throw new Error(`Weekly fetch failed: ${weeklyRes.status}`);
      const dailyData = await dailyRes.json();
      const weeklyData = await weeklyRes.json();
      setTemplates(dailyData.templates);
      setBlocks(dailyData.dailyBlocks);
      setAllocations(weeklyData.allocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  function onAllocDragStart(e: React.DragEvent, alloc: Allocation) {
    const remaining = +(alloc.hrsAllocated - alloc.hrsCompleted).toFixed(2);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ weeklyAllocationId: alloc.id, type: alloc.type, remaining, name: alloc.topic.name })
    );
  }

  async function onDayDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { weeklyAllocationId, remaining, name } = JSON.parse(raw);

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let hourOffset = offsetY / HOUR_HEIGHT;
    hourOffset = Math.round(hourOffset * 4) / 4; // snap to 15 min
    hourOffset = Math.max(0, Math.min(GRID_END_HOUR - GRID_START_HOUR, hourOffset));
    const totalMinutes = hourOffset * 60;
    const hh = String(GRID_START_HOUR + Math.floor(totalMinutes / 60)).padStart(2, "0");
    const mm = String(Math.round(totalMinutes % 60)).padStart(2, "0");
    const startTime = `${hh}:${mm}`;

    const input = window.prompt(
      `Schedule "${name}" at ${startTime}. How many hours (remaining: ${remaining})?`,
      String(remaining)
    );
    if (!input) return;
    const hrsForBlock = parseFloat(input);
    if (!hrsForBlock || hrsForBlock <= 0) return;

    await fetch("/api/daily/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, startTime, weeklyAllocationId, hrsForBlock }),
    });
    load();
  }

  async function removeBlock(id: string) {
    await fetch(`/api/daily/blocks/${id}`, { method: "DELETE" });
    load();
  }

  async function overrideTemplate(templateId: string, dateStr: string) {
    await fetch("/api/daily/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "template-override", date: dateStr, templateBlockId: templateId }),
    });
    load();
  }

  async function logProgress(block: DailyBlock) {
    const input = window.prompt(
      `Hours completed for "${block.weeklyAllocation?.topic.name}"?`,
      ""
    );
    if (!input) return;
    const hrsLogged = parseFloat(input);
    if (!hrsLogged || hrsLogged <= 0) return;
    await fetch("/api/daily/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyBlockId: block.id, hrsLogged }),
    });
    load();
  }

  async function addTemplate() {
    if (!tForm.title) return;
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tForm),
    });
    setTForm({ title: "", dayOfWeek: "1", start: "07:00", end: "08:00" });
    setShowTemplateForm(false);
    load();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this recurring block from every week?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    load();
  }

  const hourRows = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, i) => GRID_START_HOUR + i
  );

  return (
    <main className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-medium">Daily plan</h1>
          <p className="text-sm text-neutral-500">{weekLabel(weekStart)}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
          >
            ← Prev week
          </button>
          <button
            className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
          >
            Next week →
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          className="text-xs text-blue-700"
          onClick={() => setShowTemplateForm((v) => !v)}
        >
          {showTemplateForm ? "Hide" : "Manage"} recurring class/gym blocks
        </button>
        {showTemplateForm && (
          <div className="mt-2 border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <div className="flex flex-wrap gap-2 items-end mb-2">
              <input
                className="border border-neutral-300 rounded px-2 py-1 text-xs flex-1 min-w-[120px]"
                placeholder="Title (e.g. Gym, DBMS class)"
                value={tForm.title}
                onChange={(e) => setTForm((f) => ({ ...f, title: e.target.value }))}
              />
              <select
                className="border border-neutral-300 rounded px-2 py-1 text-xs"
                value={tForm.dayOfWeek}
                onChange={(e) => setTForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
              >
                <option value="1">Mon</option>
                <option value="2">Tue</option>
                <option value="3">Wed</option>
                <option value="4">Thu</option>
                <option value="5">Fri</option>
                <option value="6">Sat</option>
                <option value="0">Sun</option>
              </select>
              <input
                type="time"
                className="border border-neutral-300 rounded px-2 py-1 text-xs"
                value={tForm.start}
                onChange={(e) => setTForm((f) => ({ ...f, start: e.target.value }))}
              />
              <input
                type="time"
                className="border border-neutral-300 rounded px-2 py-1 text-xs"
                value={tForm.end}
                onChange={(e) => setTForm((f) => ({ ...f, end: e.target.value }))}
              />
              <button
                onClick={addTemplate}
                className="bg-neutral-900 text-white rounded px-3 py-1 text-xs"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <span
                  key={t.id}
                  className="bg-neutral-200 text-neutral-700 text-xs rounded-full px-2 py-1 flex items-center gap-1"
                >
                  {DAY_LABELS[t.dayOfWeek === 0 ? 6 : t.dayOfWeek - 1]} {t.title} {t.start}-{t.end}
                  <button onClick={() => deleteTemplate(t.id)} className="text-neutral-500">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-neutral-500">Loading...</p>}

      {!loading && (
        <div className="grid grid-cols-[220px_1fr] gap-6">
          {/* Left: this week's allocations, drag source */}
          <div>
            <h2 className="text-sm font-medium mb-2 text-neutral-600">
              This week's allocations — drag onto grid →
            </h2>
            <div className="flex flex-col gap-2">
              {allocations.map((a) => {
                const remaining = +(a.hrsAllocated - a.hrsCompleted).toFixed(2);
                if (remaining <= 0) return null;
                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => onAllocDragStart(e, a)}
                    className="cursor-grab border border-neutral-200 rounded-lg p-2 bg-white text-xs"
                  >
                    <div className="font-medium">{a.topic.name}</div>
                    <div className="text-neutral-400">{a.topic.subject.name}</div>
                    <div className={`inline-block mt-1 text-white rounded-full px-2 py-0.5 ${TYPE_COLOR[a.type]}`}>
                      {a.type} · {remaining}h left
                    </div>
                  </div>
                );
              })}
              {allocations.length === 0 && (
                <p className="text-xs text-neutral-400">
                  No allocations this week — go to Weekly plan first.
                </p>
              )}
            </div>
          </div>

          {/* Right: time grid */}
          <div className="overflow-x-auto">
            <div className="flex" style={{ minWidth: 900 }}>
              <div style={{ width: 44 }} />
              {days.map((d, i) => (
                <div key={i} className="flex-1 text-center text-xs font-medium text-neutral-700 pb-1">
                  {DAY_LABELS[i]} <span className="text-neutral-400">{d.getUTCDate()}</span>
                </div>
              ))}
            </div>
            <div className="flex" style={{ minWidth: 900 }}>
              <div style={{ width: 44 }}>
                {hourRows.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="text-[10px] text-neutral-400 text-right pr-1 -mt-1.5"
                  >
                    {h}:00
                  </div>
                ))}
              </div>
              {days.map((d, i) => {
                const dateStr = toDateParam(d);
                const weekday = d.getUTCDay();
                const dayBlocks = blocks.filter((b) => toDateParam(new Date(b.date)) === dateStr);
                const overrideTemplateIds = new Set(
                  dayBlocks.filter((b) => b.isTemplateOverride).map((b) => b.templateBlockId)
                );
                const visibleTemplates = templates.filter(
                  (t) => t.dayOfWeek === weekday && !overrideTemplateIds.has(t.id)
                );
                const allocBlocks = dayBlocks.filter((b) => !b.isTemplateOverride);

                return (
                  <div
                    key={i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDayDrop(e, dateStr)}
                    className="flex-1 relative border-l border-neutral-100"
                    style={{ height: hourRows.length * HOUR_HEIGHT }}
                  >
                    {hourRows.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-dashed border-neutral-100"
                        style={{ top: (h - GRID_START_HOUR) * HOUR_HEIGHT }}
                      />
                    ))}

                    {visibleTemplates.map((t) => {
                      const [sh, sm] = t.start.split(":").map(Number);
                      const [eh, em] = t.end.split(":").map(Number);
                      const top = (sh - GRID_START_HOUR) * HOUR_HEIGHT + (sm / 60) * HOUR_HEIGHT;
                      const height = ((eh - sh) * 60 + (em - sm)) / 60 * HOUR_HEIGHT;
                      return (
                        <div
                          key={t.id}
                          style={{ top, height }}
                          className="absolute left-0.5 right-0.5 bg-neutral-200 text-neutral-600 rounded text-[10px] px-1 py-0.5 overflow-hidden group"
                        >
                          {t.title}
                          <button
                            onClick={() => overrideTemplate(t.id, dateStr)}
                            className="absolute top-0 right-0.5 opacity-0 group-hover:opacity-100 text-neutral-500"
                            title="Remove for this date only"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}

                    {allocBlocks.map((b) => {
                      const top = (minutesSinceGridStart(b.start) / 60) * HOUR_HEIGHT;
                      const height =
                        ((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000 / 60) *
                        HOUR_HEIGHT;
                      const type = b.weeklyAllocation?.type ?? "LECTURE";
                      return (
                        <div
                          key={b.id}
                          style={{ top, height }}
                          className={`absolute left-0.5 right-0.5 ${TYPE_COLOR[type]} text-white rounded text-[10px] px-1 py-0.5 overflow-hidden cursor-pointer group`}
                          onClick={() => logProgress(b)}
                          title="Click to log completed hours"
                        >
                          {b.weeklyAllocation?.topic.name} ({fmtTime(b.start)})
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(b.id);
                            }}
                            className="absolute top-0 right-0.5 opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
