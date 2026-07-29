/** App base path from Vite (`/site/` locally, `/` on Railway). Always ends with `/`. */
export const BASE_URL = import.meta.env.BASE_URL;

/** React Router basename without trailing slash (`/site` or `''`). */
export const ROUTER_BASENAME = BASE_URL.replace(/\/$/, '');

/** Build an API URL under the current base path. */
export function apiUrl(script: string, query?: string): string {
  const path = `${BASE_URL}api/${script.replace(/^\//, '')}`;
  return query ? `${path}?${query}` : path;
}
