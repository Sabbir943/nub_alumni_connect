import BrowseStudents from '@/component/BrowseStudents';

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
