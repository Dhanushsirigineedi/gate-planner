"use client";

import { useEffect, useState, useCallback } from "react";
import { mondayOf, addDays, toDateParam, weekLabel } from "@/lib/week";

type Topic = {
  id: string;
  name: string;
  lectureHrs: number;
  pyqHrs: number;
  revisionHrs: number;
  lectureHrsDone: number;
  pyqHrsDone: number;
  revisionHrsDone: number;
};
type Subject = { id: string; name: string; topics: Topic[] };

type Allocation = {
  id: string;
  type: "LECTURE" | "PYQ" | "REVISION";
  hrsAllocated: number;
  hrsCompleted: number;
  status: string;
  topic: { id: string; name: string; subject: { name: string } };
};

type Disturbance = {
  id: string;
  description: string;
  start: string;
  end: string;
  hrsLost: number;
};

type WeeklyPlanData = {
  id: string;
  weekStart: string;
  nominatedHrs: number;
  disturbances: Disturbance[];
  allocations: Allocation[];
};

const TYPE_LABEL: Record<string, string> = {
  LECTURE: "Lecture",
  PYQ: "PYQ",
  REVISION: "Revision",
};
const TYPE_COLOR: Record<string, string> = {
  LECTURE: "bg-blue-50 text-blue-800 border-blue-200",
  PYQ: "bg-green-50 text-green-800 border-green-200",
  REVISION: "bg-pink-50 text-pink-800 border-pink-200",
};

function remaining(total: number, done: number) {
  return Math.max(0, +(total - done).toFixed(2));
}

export default function WeeklyPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [plan, setPlan] = useState<WeeklyPlanData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nominatedInput, setNominatedInput] = useState("0");
  const [showDisturbanceForm, setShowDisturbanceForm] = useState(false);
  const [dForm, setDForm] = useState({ description: "", start: "", end: "", hrsLost: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planRes, subjectsRes] = await Promise.all([
        fetch(`/api/weekly?weekStart=${toDateParam(weekStart)}`),
        fetch("/api/subjects"),
      ]);
      if (!planRes.ok) throw new Error(`Weekly plan fetch failed: ${planRes.status}`);
      if (!subjectsRes.ok) throw new Error(`Subjects fetch failed: ${subjectsRes.status}`);
      const planData = await planRes.json();
      const subjectsData = await subjectsRes.json();
      setPlan(planData);
      setNominatedInput(String(planData.nominatedHrs));
      setSubjects(subjectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNominated() {
    if (!plan) return;
    await fetch("/api/weekly", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.id, nominatedHrs: nominatedInput }),
    });
    load();
  }

  async function addDisturbance() {
    if (!plan || !dForm.description || !dForm.start || !dForm.end || !dForm.hrsLost) return;
    await fetch("/api/weekly/disturbances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weeklyPlanId: plan.id,
        description: dForm.description,
        start: dForm.start,
        end: dForm.end,
        hrsLost: dForm.hrsLost,
      }),
    });
    setDForm({ description: "", start: "", end: "", hrsLost: "" });
    setShowDisturbanceForm(false);
    load();
  }

  async function deleteDisturbance(id: string) {
    await fetch(`/api/weekly/disturbances/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteAllocation(id: string) {
    await fetch(`/api/weekly/allocations/${id}`, { method: "DELETE" });
    load();
  }

  async function updateAllocationHrs(id: string, hrs: string) {
    await fetch(`/api/weekly/allocations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hrsAllocated: hrs }),
    });
    load();
  }

  function onDragStart(
    e: React.DragEvent,
    topicId: string,
    type: "LECTURE" | "PYQ" | "REVISION",
    defaultHrs: number
  ) {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ topicId, type, defaultHrs })
    );
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!plan) return;
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { topicId, type, defaultHrs } = JSON.parse(raw);
    await fetch("/api/weekly/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weeklyPlanId: plan.id,
        topicId,
        type,
        hrsAllocated: defaultHrs,
      }),
    });
    load();
  }

  const adjustedHrs = plan
    ? +(plan.nominatedHrs - plan.disturbances.reduce((s, d) => s + d.hrsLost, 0)).toFixed(2)
    : 0;

  return (
    <main className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Weekly plan</h1>
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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-neutral-500">Loading...</p>}

      {!loading && plan && (
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* Left: syllabus drag source */}
          <div>
            <h2 className="text-sm font-medium mb-2 text-neutral-600">
              Drag from syllabus →
            </h2>
            <div className="flex flex-col gap-3">
              {subjects.map((s) => (
                <div key={s.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-100 px-3 py-1.5 text-xs font-medium">{s.name}</div>
                  <div className="p-2 flex flex-col gap-2">
                    {s.topics.map((t) => {
                      const chips: Array<["LECTURE" | "PYQ" | "REVISION", number]> = [
                        ["LECTURE", remaining(t.lectureHrs, t.lectureHrsDone)],
                        ["PYQ", remaining(t.pyqHrs, t.pyqHrsDone)],
                        ["REVISION", remaining(t.revisionHrs, t.revisionHrsDone)],
                      ];
                      return (
                        <div key={t.id} className="text-xs">
                          <div className="font-medium mb-1">{t.name}</div>
                          <div className="flex flex-wrap gap-1">
                            {chips
                              .filter(([, hrs]) => hrs > 0)
                              .map(([type, hrs]) => (
                                <div
                                  key={type}
                                  draggable
                                  onDragStart={(e) => onDragStart(e, t.id, type, hrs)}
                                  className={`cursor-grab border rounded-full px-2 py-0.5 ${TYPE_COLOR[type]}`}
                                  title="Drag into this week"
                                >
                                  {TYPE_LABEL[type]} {hrs}h
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                    {s.topics.length === 0 && (
                      <p className="text-xs text-neutral-400">No topics</p>
                    )}
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-xs text-neutral-400">
                  Add subjects/topics on the Syllabus page first.
                </p>
              )}
            </div>
          </div>

          {/* Right: budget + disturbances + allocations drop zone */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-neutral-200 rounded-xl p-4">
                <div className="text-xs text-neutral-500 mb-1">Nominated hours (real time)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    className="border border-neutral-300 rounded px-2 py-1 text-lg font-medium w-24"
                    value={nominatedInput}
                    onChange={(e) => setNominatedInput(e.target.value)}
                    onBlur={saveNominated}
                  />
                  <span className="text-sm text-neutral-400">h</span>
                </div>
              </div>
              <div className="border border-neutral-200 rounded-xl p-4">
                <div className="text-xs text-neutral-500 mb-1">Adjusted (after disturbances)</div>
                <div className="text-lg font-medium text-emerald-700">{adjustedHrs}h</div>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Disturbances</h3>
                <button
                  className="text-xs text-blue-700"
                  onClick={() => setShowDisturbanceForm((v) => !v)}
                >
                  + Add
                </button>
              </div>
              {plan.disturbances.length === 0 && (
                <p className="text-xs text-neutral-400">None logged this week.</p>
              )}
              <div className="flex flex-col gap-1.5">
                {plan.disturbances.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center bg-orange-50 text-orange-800 text-xs rounded px-2 py-1.5"
                  >
                    <span>
                      {d.description} (&minus;{d.hrsLost}h)
                    </span>
                    <button onClick={() => deleteDisturbance(d.id)} className="text-orange-600">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {showDisturbanceForm && (
                <div className="mt-3 flex flex-wrap gap-2 items-end bg-neutral-50 p-2 rounded">
                  <input
                    className="border border-neutral-300 rounded px-2 py-1 text-xs flex-1 min-w-[120px]"
                    placeholder="Description"
                    value={dForm.description}
                    onChange={(e) => setDForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <input
                    type="datetime-local"
                    className="border border-neutral-300 rounded px-2 py-1 text-xs"
                    value={dForm.start}
                    onChange={(e) => setDForm((f) => ({ ...f, start: e.target.value }))}
                  />
                  <input
                    type="datetime-local"
                    className="border border-neutral-300 rounded px-2 py-1 text-xs"
                    value={dForm.end}
                    onChange={(e) => setDForm((f) => ({ ...f, end: e.target.value }))}
                  />
                  <input
                    type="number"
                    step="0.5"
                    className="border border-neutral-300 rounded px-2 py-1 text-xs w-20"
                    placeholder="Hrs lost"
                    value={dForm.hrsLost}
                    onChange={(e) => setDForm((f) => ({ ...f, hrsLost: e.target.value }))}
                  />
                  <button
                    onClick={addDisturbance}
                    className="bg-neutral-900 text-white rounded px-3 py-1 text-xs"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed border-neutral-300 rounded-xl p-4 min-h-[200px] bg-neutral-50"
            >
              <h3 className="text-sm font-medium mb-3">This week's allocations</h3>
              {plan.allocations.length === 0 && (
                <p className="text-xs text-neutral-400">
                  Drag topic chips here from the left to allocate this week's study.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {plan.allocations.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{a.topic.name}</span>
                      <span className="text-neutral-400 text-xs ml-2">
                        {a.topic.subject.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs border rounded-full px-2 py-0.5 ${TYPE_COLOR[a.type]}`}>
                        {TYPE_LABEL[a.type]}
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        defaultValue={a.hrsAllocated}
                        className="border border-neutral-300 rounded px-1.5 py-0.5 text-xs w-16"
                        onBlur={(e) => updateAllocationHrs(a.id, e.target.value)}
                      />
                      <span className="text-xs text-neutral-400">
                        done {a.hrsCompleted}h
                      </span>
                      <button
                        onClick={() => deleteAllocation(a.id)}
                        className="text-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
