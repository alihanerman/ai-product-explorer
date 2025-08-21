"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/stores/productStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const { parseSearchQuery, isLoading, searchQuery } = useProductStore();

  // Store'daki searchQuery ile local state'i senkronize et
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await parseSearchQuery(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Try: 'Apple laptops under $1500' or 'phones with 16GB RAM'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" isLoading={isLoading} disabled={!query.trim()}>
        Search
      </Button>
    </form>
  );
}
