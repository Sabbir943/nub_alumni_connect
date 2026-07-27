export async function apiFetch(path, options = {}) {
  const res = await fetch(path, options);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned ${res.status}: Expected JSON but got ${contentType}`);
  }

  return res.json();
}
