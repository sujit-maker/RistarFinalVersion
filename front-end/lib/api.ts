// lib/apis.ts

type ApiInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: any;                // allow plain objects
  headers?: HeadersInit;
};

export async function apiFetch(input: RequestInfo, init: ApiInit = {}) {
  const token    = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const userId   = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;

  const headers = new Headers(init.headers || {});
  if (token)   headers.set('Authorization', `Bearer ${token}`);
  if (userId)  headers.set('x-actor-id', userId);
  if (userType)headers.set('x-actor-role', userType);

  const isFormData    = typeof FormData    !== 'undefined' && init.body instanceof FormData;
  const isBlob        = typeof Blob        !== 'undefined' && init.body instanceof Blob;
  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && init.body instanceof ArrayBuffer;

  let body = init.body as any;

  // Auto‑JSON for plain objects
  if (!isFormData && !isBlob && !isArrayBuffer && body && typeof body === 'object' && !(body instanceof ReadableStream)) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }
  // For FormData, do NOT set Content-Type (browser sets boundary)

  const res = await fetch(input, { credentials: 'include', ...init, headers, body });

  // Throw helpful error on non‑2xx
  if (!res.ok) {
    let detail = '';
    try {
      const ct = res.headers.get('content-type') || '';
      detail = ct.includes('application/json') ? (await res.json())?.message ?? '' : await res.text();
    } catch {}
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
  }

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}
