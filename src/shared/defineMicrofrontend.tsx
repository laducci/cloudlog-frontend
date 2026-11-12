import { ComponentType, StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

/** Registra um componente React como Web Component (contrato de integração dos microfrontends). */
export function defineMicrofrontend(tag: string, App: ComponentType) {
  if (customElements.get(tag)) return;
  customElements.define(
    tag,
    class extends HTMLElement {
      private root?: Root;
      connectedCallback() {
        this.root = createRoot(this);
        this.root.render(<StrictMode><App /></StrictMode>);
      }
      disconnectedCallback() {
        this.root?.unmount();
      }
    },
  );
}
