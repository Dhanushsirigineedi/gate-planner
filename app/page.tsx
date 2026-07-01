import Link from "next/link";

const views = [
  { href: "/syllabus", label: "Syllabus bank", desc: "Subjects, topics, lecture/PYQ/revision hours" },
  { href: "/weekly", label: "Weekly plan", desc: "Nominate hours, log disturbances, allocate topics" },
  { href: "/daily", label: "Daily plan", desc: "14-day drag-and-drop schedule" },
];

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-medium mb-8">GATE CSE planner</h1>
      <div className="flex flex-col gap-4">
        {views.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="block border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 transition"
          >
            <div className="font-medium">{v.label}</div>
            <div className="text-sm text-neutral-500 mt-1">{v.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
