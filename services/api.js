// URL base de la API (sin /api al final), por ejemplo http://localhost:2800
const BASE = (process.env.API_URL || 'http://localhost:2800').replace(/\/$/, '');

/// URL que usa el NAVEGADOR para ver las imágenes (puede ser distinta de API_URL)
const PUBLICA = (process.env.API_PUBLIC_URL || BASE).replace(/\/$/, '');

export const urlPublica = (ruta) => {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta)) return ruta;           // ya es una URL completa
  return PUBLICA + (ruta.startsWith('/') ? ruta : '/' + ruta);
};
// Llama a la API y devuelve siempre { ok, status, data }.
// Lanza un error si la API no responde o si responde 5xx (lo atrapa el manejador de errores de Express).
export async function api(ruta, { method = 'GET', token, body, query } = {}) {
  const url = new URL(`${BASE}/api${ruta}`);
  for (const [k, v] of Object.entries(query || {})) if (v) url.searchParams.set(k, v);

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status >= 500) throw new Error(`La API respondió ${res.status} en ${method} ${ruta}`);

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

// Mensajes de error de una respuesta de la API, siempre como lista
export const mensajes = (r, defecto = 'Ocurrió un error, inténtalo de nuevo') =>
  r.data?.errores?.length ? r.data.errores : [r.data?.error || defecto];