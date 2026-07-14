// lib/api.js
export async function getAlumniData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${API_URL}/api/alumni-directory`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Failed to fetch alumni');
    
    return await res.json();
  } catch (error) {
    console.error("Error in getAlumniData:", error);
    return [];
  }
}