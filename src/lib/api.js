// lib/api.js
export async function getAlumniData() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    // Adding default query params to match the client-side initial state (page 1, limit 6)
    const res = await fetch(`${API_URL}/api/alumni-directory?page=1&limit=6&sort=newest`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) throw new Error('Failed to fetch alumni');
    
    return await res.json();
  } catch (error) {
    console.error("Error in getAlumniData:", error);
    return { success: false, data: [], pagination: { total: 0, totalPages: 1 } };
  }
}