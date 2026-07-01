"use client";

import { useEffect, useState } from "react";

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

type Subject = {
  id: string;
  name: string;
  topics: Topic[];
};

export default function SyllabusPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({
    name: "",
    lectureHrs: "",
    pyqHrs: "",
    revisionHrs: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addSubject() {
    if (!newSubjectName.trim()) return;
    await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjectName.trim() }),
    });
    setNewSubjectName("");
    load();
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject and all its topics?")) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    load();
  }

  async function addTopic(subjectId: string) {
    if (!topicForm.name.trim()) return;
    await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        name: topicForm.name.trim(),
        lectureHrs: topicForm.lectureHrs,
        pyqHrs: topicForm.pyqHrs,
        revisionHrs: topicForm.revisionHrs,
      }),
    });
    setTopicForm({ name: "", lectureHrs: "", pyqHrs: "", revisionHrs: "" });
    setAddingTopicFor(null);
    load();
  }

  async function deleteTopic(id: string) {
    if (!confirm("Delete this topic?")) return;
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    load();
  }

  function remaining(total: number, done: number) {
    return Math.max(0, total - done);
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-medium mb-1">Syllabus bank</h1>
      <p className="text-sm text-neutral-500 mb-6">
        All hours are lecture time for lectures, real time for PYQ &amp; revision.
      </p>

      <div className="flex gap-2 mb-8">
        <input
          className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm"
          placeholder="New subject name"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubject()}
        />
        <button
          onClick={addSubject}
          className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm"
        >
          Add subject
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}

      {!loading && !error && subjects.length === 0 && (
        <p className="text-sm text-neutral-500">No subjects yet. Add one above.</p>
      )}

      <div className="flex flex-col gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-neutral-100 px-4 py-2.5">
              <button
                className="font-medium text-sm flex-1 text-left"
                onClick={() =>
                  setExpanded((e) => ({ ...e, [subject.id]: !e[subject.id] }))
                }
              >
                {expanded[subject.id] ? "▾" : "▸"} {subject.name}
                <span className="text-neutral-400 ml-2 text-xs">
                  {subject.topics.length} topic{subject.topics.length !== 1 ? "s" : ""}
                </span>
              </button>
              <button
                onClick={() => deleteSubject(subject.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>

            {expanded[subject.id] && (
              <div className="divide-y divide-neutral-100">
                {subject.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <div className="font-medium">{topic.name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-blue-50 text-blue-800 rounded-full px-2 py-0.5">
                        Lecture {remaining(topic.lectureHrs, topic.lectureHrsDone)}/{topic.lectureHrs}h
                      </span>
                      <span className="bg-green-50 text-green-800 rounded-full px-2 py-0.5">
                        PYQ {remaining(topic.pyqHrs, topic.pyqHrsDone)}/{topic.pyqHrs}h
                      </span>
                      <span className="bg-pink-50 text-pink-800 rounded-full px-2 py-0.5">
                        Revision {remaining(topic.revisionHrs, topic.revisionHrsDone)}/{topic.revisionHrs}h
                      </span>
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        className="text-red-600 hover:underline ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {addingTopicFor === subject.id ? (
                  <div className="px-4 py-3 flex flex-wrap gap-2 items-center bg-neutral-50">
                    <input
                      className="border border-neutral-300 rounded px-2 py-1 text-sm flex-1 min-w-[140px]"
                      placeholder="Topic name"
                      value={topicForm.name}
                      onChange={(e) =>
                        setTopicForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                    <input
                      className="border border-neutral-300 rounded px-2 py-1 text-sm w-24"
                      placeholder="Lecture hrs"
                      type="number"
                      step="0.5"
                      value={topicForm.lectureHrs}
                      onChange={(e) =>
                        setTopicForm((f) => ({ ...f, lectureHrs: e.target.value }))
                      }
                    />
                    <input
                      className="border border-neutral-300 rounded px-2 py-1 text-sm w-24"
                      placeholder="PYQ hrs"
                      type="number"
                      step="0.5"
                      value={topicForm.pyqHrs}
                      onChange={(e) =>
                        setTopicForm((f) => ({ ...f, pyqHrs: e.target.value }))
                      }
                    />
                    <input
                      className="border border-neutral-300 rounded px-2 py-1 text-sm w-24"
                      placeholder="Revision hrs"
                      type="number"
                      step="0.5"
                      value={topicForm.revisionHrs}
                      onChange={(e) =>
                        setTopicForm((f) => ({ ...f, revisionHrs: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => addTopic(subject.id)}
                      className="bg-neutral-900 text-white rounded px-3 py-1 text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setAddingTopicFor(null)}
                      className="text-neutral-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTopicFor(subject.id)}
                    className="w-full text-left px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50"
                  >
                    + Add topic
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
