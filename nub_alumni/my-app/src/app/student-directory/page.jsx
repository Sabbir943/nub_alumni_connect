import dynamic from "next/dynamic";

const BrowseStudents = dynamic(() => import("@/component/BrowseStudents"), {
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

export const metadata = {
  title: 'Student Directory | NUB Alumni Connect',
  description: 'Discover and connect with current students from Northern University Bangladesh.',
};

export default function StudentDirectoryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <BrowseStudents />
      </div>
    </main>
  );
}
