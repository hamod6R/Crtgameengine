import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";

// Pages
import HomePage from "./pages/home";
import EditorPage from "./pages/editor";
import NotFound from "./pages/not-found";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
);
