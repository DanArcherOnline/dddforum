import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { UserSessionProvider } from "./context/UserSessionContext";
import "./index.css";
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserSessionProvider>
        <App />
        <Toaster richColors position="top-center" />
      </UserSessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
