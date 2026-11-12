import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, notifyChange } from "../../shared/api";
import { kg } from "../../shared/format";
import { ListResult, Vehicle, VEHICLE_STATUSES } from "../../shared/types";
import { Badge, Empty, Field } from "../../shared/ui";

const EMPTY = { plate: "", model: "", capacityKg: "", status: "Disponível" };

export function VehiclesPanel({ onMessage }: { onMessage: (kind: "ok" | "error", text: string) => void }) {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems((await api<ListResult<Vehicle>>("GET", "/vehicles")).items); } catch (e) { onMessage("error", (e as Error).message); }
  }, [onMessage]);
  useEffect(() => { load(); }, [load]);

  const done = (text: string) => { onMessage("ok", text); setForm(EMPTY); setEditId(null); load(); notifyChange("vehicles"); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { ...form, capacityKg: Number(form.capacityKg) };
    try {
      if (editId) { await api("PUT", `/vehicles/${editId}`, body); done(`Veículo ${form.plate.toUpperCase()} alterado.`); }
      else { await api("POST", "/vehicles", body); done(`Veículo ${form.plate.toUpperCase()} cadastrado no Azure SQL.`); }
    } catch (err) { onMessage("error", (err as Error).message); }
  }

  async function remove(v: Vehicle) {
    if (!confirm(`Excluir o veículo ${v.plate}?`)) return;
    try { await api("DELETE", `/vehicles/${v.id}`); done(`Veículo ${v.plate} excluído.`); } catch (e) { onMessage("error", (e as Error).message); }
  }

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="split">
      <form className="card form" onSubmit={submit}>
        <h2>{editId ? "Editar veículo" : "Novo veículo"}</h2>
        <div className="grid2">
          <Field label="Placa"><input value={form.plate} onChange={set("plate")} placeholder="BRA2E19" required /></Field>
          <Field label="Modelo"><input value={form.model} onChange={set("model")} placeholder="Volvo FH 540" required /></Field>
          <Field label="Capacidade (kg)"><input type="number" min="1" value={form.capacityKg} onChange={set("capacityKg")} required /></Field>
          <Field label="Status">
            <select value={form.status} onChange={set("status")}>{VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
        </div>
        <div className="actions">
          {editId && <button type="button" className="ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancelar</button>}
          <button type="submit">{editId ? "Salvar" : "Cadastrar veículo"}</button>
        </div>
      </form>
      <div className="card">
        {items.length === 0 ? <Empty>Nenhum veículo cadastrado.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Placa</th><th>Modelo</th><th className="num">Capacidade</th><th>Status</th><th /></tr></thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id}>
                    <td className="mono">{v.plate}</td><td>{v.model}</td><td className="num">{kg(v.capacityKg)}</td><td><Badge value={v.status} /></td>
                    <td><div className="row-actions">
                      <button className="small ghost" onClick={() => { setEditId(v.id); setForm({ plate: v.plate, model: v.model, capacityKg: String(v.capacityKg), status: v.status }); }}>Editar</button>
                      <button className="small danger" onClick={() => remove(v)}>Excluir</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
