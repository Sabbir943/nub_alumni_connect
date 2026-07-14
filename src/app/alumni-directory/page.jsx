import BrowseAlumni from '@/component/BrowseAlumni';
import { getAlumniData } from '@/lib/api';
import React from 'react';

const AlumniDirectory = async() => {
    const alumniData = await getAlumniData();
   
    
    return (
       <main className="max-w-7xl mx-auto py-10 px-4">
      <BrowseAlumni alumniList={alumniData} />
      </main>
    );
};

export default AlumniDirectory;