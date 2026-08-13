const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;

export async function uploadImage(file) {
  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB API key is not configured.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Image upload failed.");
  }

  return data.data.url;
}

export async function uploadVideo(file) {
  if (!CLOUDINARY_URL) {
    throw new Error("Cloudinary URL is not configured. Set CLOUDINARY_URL in .env");
  }

  const cloudName = CLOUDINARY_URL.split('@')[1];
  const apiKey = CLOUDINARY_URL.split('://')[1].split(':')[0];
  const apiSecret = CLOUDINARY_URL.split(':')[2].split('@')[0];

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'nub_alumni/videos';

  const signatureRes = await fetch('/api/blog/video-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp, folder }),
  });

  const { signature } = await signatureRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('resource_type', 'video');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || 'Video upload failed.');
  }

  return {
    url: data.secure_url,
    thumbnail: data.secure_url.replace(/\.(mp4|mov|webm)$/, '.jpg').replace('/upload/', '/upload/w_600,h_400,c_fill/'),
    duration: data.duration || 0,
  };
}

export function getVideoEmbedUrl(url) {
  if (!url) return null;

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}
