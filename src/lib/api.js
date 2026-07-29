export async function apiFetch(path, options = {}) {
  const res = await fetch(path, options);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server returned ${res.status}: Expected JSON but got ${contentType}`);
  }

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
