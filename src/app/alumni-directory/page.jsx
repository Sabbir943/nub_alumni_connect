import dynamic from "next/dynamic";

const BrowseAlumni = dynamic(() => import("@/component/BrowseAlumni"), {
  loading: () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-12 bg-zinc-200 rounded-xl w-1/3 animate-pulse" />
      <div className="h-14 bg-zinc-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-zinc-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  ),
});

export default function AlumniDirectoryPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <BrowseAlumni />
    </main>
  );
}
