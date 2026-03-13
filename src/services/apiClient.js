async function readJson(response, fallbackMessage) {
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || fallbackMessage);
  }

  return body;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  return response;
}

export async function apiGet(path, fallbackMessage = 'Request failed') {
  const response = await apiFetch(path, { method: 'GET' });
  return readJson(response, fallbackMessage);
}

export async function apiPost(path, body, fallbackMessage = 'Request failed') {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return readJson(response, fallbackMessage);
}
