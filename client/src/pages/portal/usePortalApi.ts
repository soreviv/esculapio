import { useParams } from "wouter";

export function usePortalSlug(): string {
  const params = useParams<{ slug: string }>();
  return params.slug ?? "";
}

export async function portalFetch<T>(
  slug: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `/p/${slug}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
