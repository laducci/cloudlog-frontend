/**
 * Cliente HTTP compartilhado pelos microfrontends.
 * Todas as chamadas vão para o API Gateway (Azure API Management), que encaminha ao BFF.
 * O frontend NUNCA chama os microserviços diretamente.
 */
declare global {
  interface Window { CLOUDLOG_CONFIG?: { apiBaseUrl: string; subscriptionKey?: string } }
}

export interface RequestLog { method: string; url: string; status: number; ms: number; at: string }

export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const config = () => window.CLOUDLOG_CONFIG ?? { apiBaseUrl: "http://localhost:8080" };

export const gatewayUrl = () => config().apiBaseUrl.replace(/\/+$/, "");

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = gatewayUrl() + path;
  const started = performance.now();
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (config().subscriptionKey) headers["Ocp-Apim-Subscription-Key"] = config().subscriptionKey!;
  let status = 0;
  try {
    const res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    status = res.status;
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Erro ${res.status}`);
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, "Não foi possível falar com o API Gateway.");
  } finally {
    const log: RequestLog = { method, url, status, ms: Math.round(performance.now() - started), at: new Date().toISOString() };
    window.dispatchEvent(new CustomEvent<RequestLog>("cloudlog:request", { detail: log }));
  }
}

/** Avisa os outros microfrontends que os dados mudaram (comunicação por eventos do navegador). */
export const notifyChange = (what: string) => window.dispatchEvent(new CustomEvent("cloudlog:changed", { detail: what }));
