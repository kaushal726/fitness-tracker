import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles/global.css";
import { App } from "./app/App";
import { registerServiceWorker } from "./app/pwa";
import { initTheme } from "./app/theme";
import { initStore } from "./data/store";
import { ConfirmProvider } from "./ui/Confirm";
import { ToastProvider } from "./ui/Toast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);

initTheme();
void initStore();
registerServiceWorker();
