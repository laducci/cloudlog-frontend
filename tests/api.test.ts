import { api, ApiError } from "../src/shared/api";

describe("cliente do API Gateway (shared/api)", () => {
  const events: unknown[] = [];
  beforeEach(() => {
    events.length = 0;
    (globalThis as any).window = Object.assign(new EventTarget(), {
      CLOUDLOG_CONFIG: { apiBaseUrl: "https://apim.example/cloudlog/", subscriptionKey: "k" },
    });
    (globalThis as any).CustomEvent = class extends Event { detail: unknown; constructor(t: string, i: { detail: unknown }) { super(t); this.detail = i.detail; } };
    window.addEventListener("cloudlog:request", (e) => events.push((e as CustomEvent).detail));
  });

  it("chama o gateway com a chave de assinatura e registra a chamada", async () => {
    const calls: Array<[string, RequestInit]> = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => { calls.push([url, init]); return new Response('{"ok":true}', { status: 200 }); }) as never;
    await api("GET", "/aggregated-data");
    expect(calls[0][0]).toBe("https://apim.example/cloudlog/aggregated-data");
    expect((calls[0][1].headers as Record<string, string>)["Ocp-Apim-Subscription-Key"]).toBe("k");
    expect(events).toHaveLength(1);
  });

  it("transforma erro do BFF em ApiError com a mensagem", async () => {
    globalThis.fetch = (async () => new Response('{"error":"Placa inválida"}', { status: 400 })) as never;
    await expect(api("POST", "/vehicles", {})).rejects.toEqual(new ApiError(400, "Placa inválida"));
  });
});
