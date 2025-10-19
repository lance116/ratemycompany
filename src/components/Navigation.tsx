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

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-between h-16 px-3 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-md text-[10px] font-medium transition-colors flex-1 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={18} />
                <span className="line-clamp-1">{item.label}</span>
              </Link>
            );
          })}
          <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-2 flex-1">
            <AuthDialog />
            <span className="text-[10px] font-medium text-muted-foreground">Sign in</span>
          </div>
        </div>
      </div>

      {/* Add padding to body on mobile to account for bottom nav */}
      <div className="sm:hidden h-16" />
    </>
  );
};

export default Navigation;
