import { FormEvent, useEffect, useState } from "react";
import { api } from "../../shared/api";
import { brl, dateTime, hours } from "../../shared/format";
import { Delivery, FreightQuote } from "../../shared/types";
import { Field } from "../../shared/ui";

const EMPTY = { code: "", customer: "", origin: "", destination: "", weightKg: "", distanceKm: "" };
type FormState = typeof EMPTY;

export function DeliveryForm({ editing, onSaved, onCancel, onError }: {
  editing: Delivery | null;
  onSaved: (d: Delivery, created: boolean) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [quote, setQuote] = useState<FreightQuote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuote(null);
    setForm(editing ? {
      code: editing.code, customer: editing.customer, origin: editing.origin, destination: editing.destination,
      weightKg: String(editing.weightKg), distanceKm: String(editing.distanceKm),
    } : EMPTY);
  }, [editing]);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function simulate() {
    try {
      setQuote(await api<FreightQuote>("GET", `/freight-quote?distanceKm=${form.distanceKm}&weightKg=${form.weightKg}`));
    } catch (e) { onError((e as Error).message); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = { ...form, weightKg: Number(form.weightKg), distanceKm: Number(form.distanceKm) };
    try {
      if (editing) {
        const { code: _code, ...changes } = body;
        onSaved(await api<Delivery>("PUT", `/deliveries/${editing.id}`, changes), false);
      } else {
        onSaved(await api<Delivery>("POST", "/deliveries", body), true);
        setForm(EMPTY);
        setQuote(null);
      }
    } catch (err) { onError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <form className="card form wide" onSubmit={submit}>
      <h2>{editing ? `Editar ${editing.code}` : "Nova entrega"}</h2>
      <div className="grid3">
        <Field label="Código"><input value={form.code} onChange={set("code")} placeholder="ENT-1001" required disabled={!!editing} /></Field>
        <Field label="Cliente"><input value={form.customer} onChange={set("customer")} placeholder="Mercado Bom Preço" required /></Field>
        <Field label="Origem"><input value={form.origin} onChange={set("origin")} placeholder="Curitiba - PR" required /></Field>
        <Field label="Destino"><input value={form.destination} onChange={set("destination")} placeholder="Joinville - SC" required /></Field>
        <Field label="Peso (kg)"><input type="number" min="1" value={form.weightKg} onChange={set("weightKg")} required /></Field>
        <Field label="Distância (km)"><input type="number" min="1" value={form.distanceKm} onChange={set("distanceKm")} required /></Field>
      </div>
      {quote && (
        <div className="quote">
          <strong>{brl(quote.freightCost)}</strong> · {quote.serviceLevel} · prazo {hours(quote.etaHours)} · previsão {dateTime(quote.estimatedDeliveryAt)}
          <div className="muted small">Cotação calculada pela Azure Function (via BFF).</div>
        </div>
      )}
      <div className="actions">
        <button type="button" className="ghost" onClick={simulate} disabled={!form.distanceKm || !form.weightKg}>Simular frete</button>
        {editing && <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>}
        <button type="submit" disabled={busy}>{busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar entrega"}</button>
      </div>
    </form>
  );
}
