"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Clock,
  TrendingUp,
  Hash,
  ShoppingBag,
  X,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/stores/productStore";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface Suggestion {
  text: string;
  type: "product" | "brand" | "category" | "popular" | "query" | "history";
  data?: {
    brand?: string;
    category?: string;
  };
}

interface SearchHistory {
  query: string;
  timestamp: number;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const { parseSearchQuery, isLoading, searchQuery, fetchSearchSuggestions } =
    useProductStore();
  const debouncedQuery = useDebounce(query, 300);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store'daki searchQuery ile local state'i senkronize et
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("searchHistory");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error("Failed to parse search history:", error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback(
    (searchQuery: string) => {
      const newHistory = [
        { query: searchQuery, timestamp: Date.now() },
        ...searchHistory.filter((item) => item.query !== searchQuery),
      ].slice(0, 10); // Keep only last 10 searches

      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    },
    [searchHistory]
  );

  const handleSubmit = useCallback(
    async (suggestionText?: string) => {
      const searchText = suggestionText || query.trim();
      if (!searchText) return;

      setIsOpen(false);
      setSelectedIndex(-1);
      saveToHistory(searchText);
      await parseSearchQuery(searchText);
    },
    [query, saveToHistory, parseSearchQuery]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      handleSubmit(suggestion.text);
    },
    [handleSubmit]
  );

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        // Show popular suggestions and history when no query
        const historySuggestions: Suggestion[] = searchHistory
          .slice(0, 3)
          .map((item) => ({
            text: item.query,
            type: "history" as const,
          }));

        try {
          const suggestions = (await fetchSearchSuggestions()) as Suggestion[];
          const popularSuggestions: Suggestion[] = suggestions.map(
            (s: Suggestion) => ({
              ...s,
              type: "popular" as const,
            })
          );
          setSuggestions([...historySuggestions, ...popularSuggestions]);
        } catch (error) {
          console.error("Failed to fetch popular suggestions:", error);
          setSuggestions(historySuggestions);
        }
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`
        );
        if (response.ok) {
          const data = await response.json();

          // Add recent history that matches the query
          const matchingHistory: Suggestion[] = searchHistory
            .filter((item) =>
              item.query.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 2)
            .map((item) => ({
              text: item.query,
              type: "history" as const,
            }));

          const apiSuggestions: Suggestion[] = data.suggestions || [];
          setSuggestions([...matchingHistory, ...apiSuggestions]);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [searchHistory, fetchSearchSuggestions]
  );

  // Debounced suggestion fetching
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, fetchSuggestions]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else {
            handleSubmit();
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    suggestions,
    handleSubmit,
    handleSuggestionSelect,
  ]);

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
    void fetchSuggestions(query);
  };

  const removeSuggestion = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const suggestion = suggestions[index];
    if (suggestion.type === "history") {
      const newHistory = searchHistory.filter(
        (item) => item.query !== suggestion.text
      );
      setSearchHistory(newHistory);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      void fetchSuggestions(query);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product":
        return <ShoppingBag className="h-4 w-4" />;
      case "brand":
        return <Hash className="h-4 w-4" />;
      case "category":
        return <Hash className="h-4 w-4" />;
      case "popular":
        return <TrendingUp className="h-4 w-4" />;
      case "query":
        return <Sparkles className="h-4 w-4" />;
      case "history":
        return <Clock className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionTypeText = (type: string) => {
    switch (type) {
      case "product":
        return "Product";
      case "brand":
        return "Brand";
      case "category":
        return "Category";
      case "popular":
        return "Popular";
      case "query":
        return "Suggestion";
      case "history":
        return "Recent";
      default:
        return "";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col sm:flex-row gap-2 w-full"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Try: 'Apple laptops under $1500' or 'phones with 16GB RAM'"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsOpen(true);
              void fetchSuggestions(query);
            }}
            className="pl-10 pr-4 text-sm sm:text-base text-foreground"
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!query.trim()}
          className="w-full sm:w-auto px-6"
        >
          Search
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span className="ml-2">Loading suggestions...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {searchHistory.length > 0 &&
                suggestions.some((s) => s.type === "history") && (
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearHistory}
                      className="text-xs hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}

              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between group ${
                    selectedIndex === index ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-muted-foreground flex-shrink-0">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{suggestion.text}</div>
                      {suggestion.type !== "history" && (
                        <div className="text-xs text-muted-foreground">
                          {getSuggestionTypeText(suggestion.type)}
                        </div>
                      )}
                    </div>
                  </div>

                  {suggestion.type === "history" && (
                    <button
                      onClick={(e) => removeSuggestion(index, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted-foreground/20 rounded transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No suggestions found</p>
              <p className="text-xs mt-1">
                Try searching for products, brands, or categories
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
