import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// When a new service worker takes control (app update deployed), reload once to apply it.
// hadController guard prevents a reload loop on first install (when there was no previous SW).
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
