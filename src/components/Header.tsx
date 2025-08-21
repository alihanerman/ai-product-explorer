"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogsModal } from "@/components/LogsModal";
import { FileText } from "lucide-react";

export function Header() {
  const { user, logout, checkAuth, isLoading } = useAuthStore();
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
          <span className="hidden sm:inline">AI Product Explorer</span>
          <span className="sm:hidden">APE</span>
        </Link>

        <nav className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Home
            </Link>
            {user && (
              <Link
                href="/favorites"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Favorites
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogsModalOpen(true)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              <FileText className="h-4 w-4 mr-1" />
              Logs
            </Button>
          </div>

          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-muted-foreground hidden lg:inline">
                Welcome, {user.name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoading}
                className="text-xs sm:text-sm"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Login
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
      
      <LogsModal 
        isOpen={isLogsModalOpen} 
        onClose={() => setIsLogsModalOpen(false)} 
      />
    </header>
  );
}
