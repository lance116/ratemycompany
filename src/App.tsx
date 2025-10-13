import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Vote from "./pages/Vote";
import Leaderboard from "./pages/Leaderboard";
import Reviews from "./pages/Reviews";
import CompanyDetails from "./pages/CompanyDetails";
import NotFound from "./pages/NotFound";
import AuraComparisonPopup from "./components/AuraComparisonPopup";

const queryClient = new QueryClient();

const App = () => {
  const [showAuraPopup, setShowAuraPopup] = useState(false);

  useEffect(() => {
    // Show the popup on every page reload
    console.log('Page loaded, setting timer for popup');
    const timer = setTimeout(() => {
      console.log('Timer fired, showing popup');
      setShowAuraPopup(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCloseAuraPopup = () => {
    setShowAuraPopup(false);
  };

  return (
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AuraComparisonPopup 
            isOpen={showAuraPopup} 
            onClose={handleCloseAuraPopup} 
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
