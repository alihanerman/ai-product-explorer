import { Suspense } from "react";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/HomeContent";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  );
}
