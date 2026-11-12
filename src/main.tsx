import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles/global.css";
import { initAccent } from "./app/accent";
import { App } from "./app/App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { registerServiceWorker } from "./app/pwa";
import { initTextSize } from "./app/textSize";
import { initTheme } from "./app/theme";
import { initStore } from "./data/store";
import { ConfirmProvider } from "./ui/Confirm";
import { ToastProvider } from "./ui/Toast";

// Tells the fallback in index.html that the app's script loaded, so it does not offer a reload.
(window as Window & { __appStarted?: boolean }).__appStarted = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);

initTheme();
initAccent();
initTextSize();
void initStore();
registerServiceWorker();
