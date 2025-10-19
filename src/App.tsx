import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import Vote from "./pages/Vote";
import Leaderboard from "./pages/Leaderboard";
import Reviews from "./pages/Reviews";
import CompanyDetails from "./pages/CompanyDetails";
import NotFound from "./pages/NotFound";
import { SupabaseAuthProvider } from "./providers/SupabaseAuthProvider";

const queryClient = new QueryClient();

const App = () => {
  return (
    <SupabaseAuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Vote />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/company/:id" element={<CompanyDetails />} />
              <Route path="/auth/callback" element={<Navigate to="/" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SupabaseAuthProvider>
  );
};

export default App;
