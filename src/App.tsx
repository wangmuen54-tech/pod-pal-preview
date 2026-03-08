import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AIPreview from "./pages/AIPreview";
import Preview from "./pages/Preview";
import Notes from "./pages/Notes";
import NotesList from "./pages/NotesList";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ai-preview" element={<AIPreview />} />
          <Route path="/preview/:id" element={<Preview />} />
          <Route path="/notes/:id" element={<Notes />} />
          <Route path="/notes-list" element={<NotesList />} />
          <Route path="/review" element={<Review />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
