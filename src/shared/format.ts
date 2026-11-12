export const brl = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const kg = (n: number) => `${n.toLocaleString("pt-BR")} kg`;
export const km = (n: number) => `${n.toLocaleString("pt-BR")} km`;
export const hours = (n: number | null | undefined) => (n == null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`);
export const dateTime = (iso: string | null | undefined) =>
  !iso ? "—" : new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
export const pct = (n: number) => `${Math.round(n * 100)}%`;

const STATUS_CLASS: Record<string, string> = {
  Pendente: "neutral", "Em rota": "info", Atrasada: "danger", Entregue: "success", Cancelada: "muted",
  "Disponível": "success", "Em uso": "info", "Manutenção": "warning",
};
export const statusClass = (s: string) => STATUS_CLASS[s] ?? "neutral";
