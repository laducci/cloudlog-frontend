import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, notifyChange } from "../../shared/api";
import { Driver, ListResult } from "../../shared/types";
import { Badge, Empty, Field } from "../../shared/ui";

const EMPTY = { name: "", cnh: "", cnhCategory: "E", phone: "", active: "true" };

export function DriversPanel({ onMessage }: { onMessage: (kind: "ok" | "error", text: string) => void }) {
  const [items, setItems] = useState<Driver[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems((await api<ListResult<Driver>>("GET", "/drivers")).items); } catch (e) { onMessage("error", (e as Error).message); }
  }, [onMessage]);
  useEffect(() => { load(); }, [load]);

  const done = (text: string) => { onMessage("ok", text); setForm(EMPTY); setEditId(null); load(); notifyChange("drivers"); };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { ...form, active: form.active === "true" };
    try {
      if (editId) {
        const { cnh: _cnh, ...changes } = body;
        await api("PUT", `/drivers/${editId}`, changes);
        done(`Motorista ${form.name} alterado.`);
      } else {
        await api("POST", "/drivers", body);
        done(`Motorista ${form.name} cadastrado no Azure SQL.`);
      }
    } catch (err) { onMessage("error", (err as Error).message); }
  }

  async function remove(d: Driver) {
    if (!confirm(`Excluir ${d.name}?`)) return;
    try { await api("DELETE", `/drivers/${d.id}`); done(`Motorista ${d.name} excluído.`); } catch (e) { onMessage("error", (e as Error).message); }
  }

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="split">
      <form className="card form" onSubmit={submit}>
        <h2>{editId ? "Editar motorista" : "Novo motorista"}</h2>
        <div className="grid2">
          <Field label="Nome"><input value={form.name} onChange={set("name")} required /></Field>
          <Field label="CNH"><input value={form.cnh} onChange={set("cnh")} placeholder="11 dígitos" title={editId ? "A CNH não pode ser alterada" : ""} required disabled={!!editId} /></Field>
          <Field label="Categoria">
            <select value={form.cnhCategory} onChange={set("cnhCategory")}>{["B", "C", "D", "E"].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Telefone"><input value={form.phone} onChange={set("phone")} placeholder="41999990000" required /></Field>
          <Field label="Situação">
            <select value={form.active} onChange={set("active")}><option value="true">Ativo</option><option value="false">Inativo</option></select>
          </Field>
        </div>
        <div className="actions">
          {editId && <button type="button" className="ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancelar</button>}
          <button type="submit">{editId ? "Salvar" : "Cadastrar motorista"}</button>
        </div>
      </form>
      <div className="card">
        {items.length === 0 ? <Empty>Nenhum motorista cadastrado.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>CNH</th><th>Telefone</th><th>Situação</th><th /></tr></thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td><td className="mono">{d.cnh} · {d.cnhCategory}</td><td className="mono">{d.phone}</td>
                    <td><Badge value={d.active ? "Disponível" : "Cancelada"} /></td>
                    <td><div className="row-actions">
                      <button className="small ghost" onClick={() => { setEditId(d.id); setForm({ name: d.name, cnh: d.cnh, cnhCategory: d.cnhCategory, phone: d.phone, active: String(d.active) }); }}>Editar</button>
                      <button className="small danger" onClick={() => remove(d)}>Excluir</button>
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
