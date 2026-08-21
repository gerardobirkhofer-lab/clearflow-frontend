import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './i18n';

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif"><h1>❌ Error</h1><p>No root element found</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(<App />);
  }
} catch (err: any) {
  document.body.innerHTML = `<div style="padding:40px;font-family:sans-serif"><h1>❌ Runtime Error</h1><pre style="background:#fee2e2;padding:16px;border-radius:8px">${err?.message || err}</pre><p style="color:#64748b">Check browser console for details</p></div>`;
}
