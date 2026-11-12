import { useCallback, useEffect, useState } from "react";
import { api } from "../../shared/api";
import { brl, dateTime, hours, km, pct } from "../../shared/format";
import { AggregatedData } from "../../shared/types";
import { Badge, Empty, Notice, useChangeSignal } from "../../shared/ui";

const SOURCE_LABEL: Record<string, string> = { entregas: "Entregas · MongoDB", frota: "Frota · Azure SQL", freteFunction: "Frete · Azure Function" };

export function Dashboard() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const changed = useChangeSignal();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<AggregatedData>("GET", "/aggregated-data"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, changed]);

  const k = data?.kpis;
  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Painel de operação</h1>
          <p className="sub">Uma chamada <code>GET /aggregated-data</code> ao BFF, que junta Entregas, Frota e a Function de frete.</p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => setShowJson((v) => !v)} disabled={!data}>{showJson ? "Ocultar JSON" : "Ver JSON agregado"}</button>
          <button onClick={load} disabled={loading}>{loading ? "Atualizando…" : "Atualizar"}</button>
        </div>
      </header>

      {error && <Notice kind="error">{error}</Notice>}
      {data?.warnings.map((w) => <Notice key={w} kind="warn">{w}</Notice>)}

      {data && (
        <div className="sources">
          {Object.entries(data.sources).map(([key, status]) => (
            <span key={key} className={`source ${status === "ok" ? "up" : "down"}`}><i />{SOURCE_LABEL[key] ?? key}</span>
          ))}
          <span className="muted small">gerado em {dateTime(data.generatedAt)}</span>
        </div>
      )}

      {showJson && data && <pre className="json">{JSON.stringify(data, null, 2)}</pre>}

      {k && (
        <div className="kpis">
          <div className="kpi"><span>Entregas</span><strong>{k.deliveries.total}</strong><small>{k.deliveries.byStatus["Em rota"] ?? 0} em rota · {k.deliveries.delayed} atrasadas</small></div>
          <div className="kpi"><span>Frete em aberto</span><strong>{brl(k.freight.totalFreight)}</strong><small>{k.freight.quotedDeliveries} entregas cotadas pela Function</small></div>
          <div className="kpi"><span>Prazo médio</span><strong>{hours(k.freight.averageEtaHours)}</strong><small>inclui pausas obrigatórias do motorista</small></div>
          <div className="kpi"><span>Uso da frota</span><strong>{pct(k.fleet.utilizationRate)}</strong><small>{k.fleet.availableVehicles} de {k.fleet.vehicles} veículos livres · {k.fleet.activeDrivers} motoristas ativos</small></div>
        </div>
      )}

      {data && (
        <div className="card">
          <h2>Entregas</h2>
          {data.deliveries.length === 0 ? <Empty>Nenhuma entrega cadastrada ainda. Cadastre uma na aba Entregas.</Empty> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Cliente</th><th>Rota</th><th>Status</th><th>Motorista / veículo</th><th className="num">Frete</th><th>Previsão</th></tr></thead>
                <tbody>
                  {data.deliveries.map((d) => {
                    const est = d.estimate ?? d.freightQuote;
                    return (
                      <tr key={d.id}>
                        <td className="mono">{d.code}</td>
                        <td>{d.customer}</td>
                        <td>{d.origin} → {d.destination}<div className="muted small">{km(d.distanceKm)}</div></td>
                        <td><Badge value={d.status} /></td>
                        <td>{d.driverName ?? "—"}<div className="muted small mono">{d.vehiclePlate ?? ""}</div></td>
                        <td className="num">{brl(est?.freightCost)}<div className="muted small">{d.estimate ? "gravado via evento" : d.freightQuote ? "cotação ao vivo" : ""}</div></td>
                        <td>{dateTime(est?.estimatedDeliveryAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
