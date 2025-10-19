import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Trophy, Zap, MessageSquare } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Vote", icon: Zap },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/reviews", label: "Reviews", icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50" style={{ width: '100vw' }}>
        <div className="flex items-center justify-center h-16 w-full gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          <div className="flex-shrink-0">
            <AuthDialog />
          </div>
        </div>
      </div>

      {/* Add padding to account for mobile top nav */}
      <div className="sm:hidden h-16" />

      {/* Desktop Navigation */}
      <nav className="hidden sm:block bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 max-w-7xl mx-auto">
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3">
                <img src="/ratemycompany logo.png" alt="ratemycompany" className="h-10 w-10 object-contain" />
                <span className="text-xl font-bold text-foreground">ratemycompany.ca</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-transform ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:-translate-y-1"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="block">
                <AuthDialog />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card border-t border-border">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-transform ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:-translate-y-1"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="px-3 py-2">
                <AuthDialog />
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
