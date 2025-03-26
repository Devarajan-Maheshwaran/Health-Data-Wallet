import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Web3Provider } from "./context/Web3Context";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <Web3Provider>
    <App />
    <Toaster />
  </Web3Provider>
);
