import React from 'react';
import BrowseAlumni from '@/component/BrowseAlumni';
import { getAlumniData } from '@/lib/api';

const AlumniDirectory = async () => {
  // Fetch initial data on the server for instant page load
  const initialData = await getAlumniData();
    
  return (
    <main className="max-w-7xl mx-auto py-10 px-4">
      {/* Pass the fetched data to the client component */}
      <BrowseAlumni initialAlumniData={initialData} />
    </main>
  );
};

export default AlumniDirectory;