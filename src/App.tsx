import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AIPreview from "./pages/AIPreview";
import Preview from "./pages/Preview";
import Notes from "./pages/Notes";
import NotesList from "./pages/NotesList";
import Review from "./pages/Review";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/ai-preview" element={<ProtectedRoute><AIPreview /></ProtectedRoute>} />
            <Route path="/preview/:id" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/notes-list" element={<ProtectedRoute><NotesList /></ProtectedRoute>} />
            <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
