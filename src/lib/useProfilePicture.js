'use client';
import { useState, useEffect } from 'react';

export function useProfilePicture(email) {
  const [pictureUrl, setPictureUrl] = useState(null);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    async function fetchPicture() {
      try {
        const res = await fetch(`/api/profile-picture/${encodeURIComponent(email)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.profilePictureUrl) {
          setPictureUrl(data.profilePictureUrl);
        }
      } catch {}
    }

    fetchPicture();
    return () => { cancelled = true; };
  }, [email]);

  return pictureUrl;
}
