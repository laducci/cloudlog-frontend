import { useState } from "react";
import { api } from "../../shared/api";
import { brl, dateTime, km } from "../../shared/format";
import { Delivery, Driver, Vehicle } from "../../shared/types";
import { Badge } from "../../shared/ui";

const NEXT: Record<string, string[]> = { Pendente: ["Cancelada"], "Em rota": ["Entregue", "Atrasada"], Atrasada: ["Entregue", "Em rota"] };
const ACTION_LABEL: Record<string, string> = { Cancelada: "Cancelar", Entregue: "Marcar entregue", Atrasada: "Marcar atraso", "Em rota": "Retomar rota" };

export function DeliveryRow({ d, onChanged, onEdit, onError }: {
  d: Delivery; onChanged: (msg: string) => void; onEdit: () => void; onError: (msg: string) => void;
}) {
  const [dispatching, setDispatching] = useState(false);
  const [options, setOptions] = useState<{ drivers: Driver[]; vehicles: Vehicle[] }>({ drivers: [], vehicles: [] });
  const [pick, setPick] = useState({ driverId: "", vehicleId: "" });

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); onChanged(msg); } catch (e) { onError((e as Error).message); }
  };

  async function openDispatch() {
    try {
      const [drivers, vehicles] = await Promise.all([
        api<{ items: Driver[] }>("GET", "/drivers?active=true"),
        api<{ items: Vehicle[] }>("GET", `/vehicles?status=${encodeURIComponent("Disponível")}`),
      ]);
      setOptions({ drivers: drivers.items, vehicles: vehicles.items });
      setDispatching(true);
    } catch (e) { onError((e as Error).message); }
  }

  return (
    <>
      <tr>
        <td className="mono">{d.code}</td>
        <td>{d.customer}<div className="muted small">{d.origin} → {d.destination} · {km(d.distanceKm)}</div></td>
        <td><Badge value={d.status} /></td>
        <td className="num">{brl(d.estimate?.freightCost)}<div className="muted small">{d.estimate ? `previsão ${dateTime(d.estimate.estimatedDeliveryAt)}` : "aguardando a Function"}</div></td>
        <td><div className="row-actions">
          {d.status === "Pendente" && <button className="small" onClick={openDispatch}>Despachar</button>}
          {(NEXT[d.status] ?? []).map((s) => (
            <button key={s} className="small ghost" onClick={() => run(() => api("PUT", `/deliveries/${d.id}`, { status: s }), `${d.code}: ${s}.`)}>{ACTION_LABEL[s] ?? s}</button>
          ))}
          {!["Entregue", "Cancelada"].includes(d.status) && <button className="small ghost" onClick={onEdit}>Editar</button>}
          <button className="small danger" onClick={() => confirm(`Excluir ${d.code}?`) && run(() => api("DELETE", `/deliveries/${d.id}`), `${d.code} excluída.`)}>Excluir</button>
        </div></td>
      </tr>
      {dispatching && (
        <tr className="sub-row">
          <td colSpan={5}>
            <div className="dispatch">
              <select value={pick.driverId} onChange={(e) => setPick((p) => ({ ...p, driverId: e.target.value }))}>
                <option value="">Motorista…</option>
                {options.drivers.map((m) => <option key={m.id} value={m.id}>{m.name} (CNH {m.cnhCategory})</option>)}
              </select>
              <select value={pick.vehicleId} onChange={(e) => setPick((p) => ({ ...p, vehicleId: e.target.value }))}>
                <option value="">Veículo disponível…</option>
                {options.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.model} · até {v.capacityKg} kg</option>)}
              </select>
              <button className="small" disabled={!pick.driverId || !pick.vehicleId}
                onClick={() => run(() => api("POST", `/deliveries/${d.id}/assign`, pick), `${d.code} saiu em rota.`).then(() => setDispatching(false))}>
                Confirmar despacho
              </button>
              <button className="small ghost" onClick={() => setDispatching(false)}>Cancelar</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
