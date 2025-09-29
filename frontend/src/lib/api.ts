// src/lib/api.ts
const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

type Json = Record<string, any>;

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;

  const text = await res.text();
  return text as unknown as T;
}

export const get  = <T = any>(p: string) => api<T>(p);
export const post = <T = any>(p: string, body?: Json) =>
  api<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
export const put  = <T = any>(p: string, body?: Json) =>
  api<T>(p, { method: 'PUT',  body: body ? JSON.stringify(body) : undefined });
export const del  = <T = any>(p: string) =>
  api<T>(p, { method: 'DELETE' });

export async function getBlob(path: string): Promise<Blob> {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(await res.text());
  return await res.blob();
}

export async function postFile<T = any>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(API + path, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}
