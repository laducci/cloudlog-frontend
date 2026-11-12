import { ReactNode, useEffect, useState } from "react";
import { statusClass } from "./format";

export const Badge = ({ value }: { value: string }) => <span className={`badge ${statusClass(value)}`}>{value}</span>;

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Notice({ kind, children, onClose }: { kind: "error" | "ok" | "warn"; children: ReactNode; onClose?: () => void }) {
  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && <button className="link" onClick={onClose} aria-label="Fechar">×</button>}
    </div>
  );
}

/** Recarrega quando outro microfrontend avisa que os dados mudaram. */
export function useChangeSignal(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("cloudlog:changed", h);
    return () => window.removeEventListener("cloudlog:changed", h);
  }, []);
  return tick;
}

export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;
