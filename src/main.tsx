import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "@/App";
import "@/index.css";

// `BrowserRouter` lit l'URL du navigateur (history API) : d'où la réécriture vers index.html
// côté hébergeur (vercel.json), sans quoi un rechargement sur /galerie renverrait un 404.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
