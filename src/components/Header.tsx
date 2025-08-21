"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/authStore";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { user, logout, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          AI Product Explorer
        </Link>

        <nav className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Anasayfa
            </Link>
            {user && (
              <Link
                href="/favorites"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Favoriler
              </Link>
            )}
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Hoşgeldin, {user.name || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoading}
              >
                Çıkış
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Giriş
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
