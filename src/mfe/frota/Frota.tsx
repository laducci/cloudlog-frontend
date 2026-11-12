import { useCallback, useState } from "react";
import { Notice } from "../../shared/ui";
import { DriversPanel } from "./DriversPanel";
import { VehiclesPanel } from "./VehiclesPanel";

export function Frota() {
  const [tab, setTab] = useState<"vehicles" | "drivers">("vehicles");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const onMessage = useCallback((kind: "ok" | "error", text: string) => setMsg({ kind, text }), []);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Frota</h1>
          <p className="sub">CRUD pelo BFF → Microserviço de Frota (Azure SQL Database).</p>
        </div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "vehicles"} className={tab === "vehicles" ? "active" : ""} onClick={() => setTab("vehicles")}>Veículos</button>
          <button role="tab" aria-selected={tab === "drivers"} className={tab === "drivers" ? "active" : ""} onClick={() => setTab("drivers")}>Motoristas</button>
        </div>
      </header>
      {msg && <Notice kind={msg.kind} onClose={() => setMsg(null)}>{msg.text}</Notice>}
      {tab === "vehicles" ? <VehiclesPanel onMessage={onMessage} /> : <DriversPanel onMessage={onMessage} />}
    </section>
  );
}
