export async function apiFetch(path, options = {}, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(path, options);

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status >= 500 && attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
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
    } catch (err) {
      lastError = err;
      if (err.status || attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
