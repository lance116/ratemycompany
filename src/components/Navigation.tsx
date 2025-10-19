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
      <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
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
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-transform ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:-translate-y-1"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              <div className="hidden sm:block">
                <AuthDialog />
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center gap-2">
              <AuthDialog />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="flex flex-col items-center justify-center gap-1 py-2">
            <AuthDialog />
          </div>
        </div>
      </div>

      {/* Add padding to body on mobile to account for bottom nav */}
      <div className="sm:hidden h-16" />
    </>
  );
};

export default Navigation;
