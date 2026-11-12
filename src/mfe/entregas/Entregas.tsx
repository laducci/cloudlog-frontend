import { useCallback, useEffect, useState } from "react";
import { api, notifyChange } from "../../shared/api";
import { Delivery, DELIVERY_STATUSES, ListResult } from "../../shared/types";
import { Empty, Notice, useChangeSignal } from "../../shared/ui";
import { DeliveryForm } from "./DeliveryForm";
import { DeliveryRow } from "./DeliveryRow";

export function Entregas() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [filter, setFilter] = useState({ status: "", search: "" });
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const changed = useChangeSignal();

  const load = useCallback(async () => {
    const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v)).toString();
    try {
      setItems((await api<ListResult<Delivery>>("GET", `/deliveries${qs ? `?${qs}` : ""}`)).items);
    } catch (e) { setMsg({ kind: "error", text: (e as Error).message }); }
  }, [filter]);

  useEffect(() => { load(); }, [load, changed]);

  const ok = (text: string) => { setMsg({ kind: "ok", text }); notifyChange("deliveries"); };
  const fail = (text: string) => setMsg({ kind: "error", text });

  function saved(d: Delivery, created: boolean) {
    setEditing(null);
    ok(created
      ? `Entrega ${d.code} cadastrada. O evento DeliveryCreated foi publicado; a Azure Function grava o frete em alguns segundos.`
      : `Entrega ${d.code} alterada.`);
    if (created) setTimeout(load, 5000); // tempo da fila + Function
  }

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Entregas</h1>
          <p className="sub">CRUD pelo BFF → Microserviço de Entregas (MongoDB Atlas). Cada alteração publica um evento no Service Bus.</p>
        </div>
      </header>
      {msg && <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice>}
      <div className="stack">
        <DeliveryForm editing={editing} onSaved={saved} onCancel={() => setEditing(null)} onError={fail} />
        <div className="card">
          <div className="toolbar">
            <input placeholder="Buscar por código, cliente ou destino" value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
            <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Todos os status</option>
              {DELIVERY_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="ghost" onClick={load}>Recarregar</button>
          </div>
          {items.length === 0 ? <Empty>Nenhuma entrega encontrada.</Empty> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Cliente / rota</th><th>Status</th><th className="num">Frete</th><th /></tr></thead>
                <tbody>
                  {items.map((d) => <DeliveryRow key={d.id} d={d} onChanged={ok} onEdit={() => setEditing(d)} onError={fail} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
