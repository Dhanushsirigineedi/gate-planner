export default function AdminPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-medium mb-1">Admin</h1>
      <p className="text-sm text-neutral-500 mb-8">
        Structural settings for the planner. More sections will land here in later phases.
      </p>

      <div className="flex flex-col gap-4">
        <div className="border border-dashed border-neutral-300 rounded-xl p-5 text-sm text-neutral-500">
          <div className="font-medium text-neutral-700 mb-1">Speed factor</div>
          Coming in a later phase — adjust the global lecture speed factor here.
        </div>
        <div className="border border-dashed border-neutral-300 rounded-xl p-5 text-sm text-neutral-500">
          <div className="font-medium text-neutral-700 mb-1">Recurring class/gym blocks</div>
          Coming in a later phase — moving here from the Daily plan page.
        </div>
      </div>
    </main>
  );
}
