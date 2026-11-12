/**
 * SHELL do microfrontend: faz o roteamento e carrega sob demanda cada microfrontend
 * (Dashboard, Entregas, Frota). Cada um é um módulo ES separado que registra um Web Component.
 */
import "./styles.css";

type RequestLog = { method: string; url: string; status: number; ms: number; at: string };

const ROUTES: Record<string, { module: string; tag: string; title: string }> = {
  dashboard: { module: "./mfe/dashboard.js", tag: "cloudlog-dashboard", title: "Painel" },
  entregas: { module: "./mfe/entregas.js", tag: "cloudlog-entregas", title: "Entregas" },
  frota: { module: "./mfe/frota.js", tag: "cloudlog-frota", title: "Frota" },
};

const outlet = document.getElementById("outlet")!;
const loaded = new Set<string>();

async function render() {
  const name = location.hash.replace(/^#\/?/, "") || "dashboard";
  const route = ROUTES[name] ?? ROUTES.dashboard;
  document.querySelectorAll<HTMLAnchorElement>("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  document.title = `CloudLog · ${route.title}`;
  outlet.innerHTML = `<p class="loading">Carregando microfrontend ${route.title}…</p>`;
  try {
    if (!loaded.has(route.module)) {
      await import(/* @vite-ignore */ new URL(route.module, document.baseURI).href);
      loaded.add(route.module);
    }
    outlet.replaceChildren(document.createElement(route.tag));
  } catch (err) {
    outlet.innerHTML = `<div class="notice error">Não foi possível carregar o microfrontend ${route.title}.</div>`;
    console.error(err);
  }
}

const calls = document.getElementById("calls")!;
const history: RequestLog[] = [];
window.addEventListener("cloudlog:request", (e) => {
  history.unshift((e as CustomEvent<RequestLog>).detail);
  history.length = Math.min(history.length, 6);
  calls.replaceChildren(...history.map((r) => {
    const li = document.createElement("li");
    const path = r.url.replace(/^https?:\/\/[^/]+/, "");
    li.innerHTML = `<b class="m">${r.method}</b> <span class="p"></span> <span class="s ${r.status >= 200 && r.status < 400 ? "ok" : "err"}">${r.status || "erro"}</span> <span class="t">${r.ms} ms</span>`;
    li.querySelector(".p")!.textContent = path;
    li.title = r.url;
    return li;
  }));
});

const cfg = (window as unknown as { CLOUDLOG_CONFIG?: { apiBaseUrl: string } }).CLOUDLOG_CONFIG;
document.getElementById("gateway")!.textContent = cfg ? `Gateway: ${new URL(cfg.apiBaseUrl).host}` : "";

window.addEventListener("hashchange", render);
render();
