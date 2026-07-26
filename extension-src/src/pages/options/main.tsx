import React from "react";
import { createRoot } from "react-dom/client";
import "@/tokens.css";
import { initI18n } from "@/lib/i18n";
import { App } from "./App";

await initI18n();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);