"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Product } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface EnhancedComparisonViewProps {
  products: Product[];
  comparisonSummary?: string | null;
  onRegenerateWithPreferences?: (preferences: UserPreferences) => void;
}

interface UserPreferences {
  budget?: "low" | "medium" | "high";
  screenSize?: "compact" | "standard" | "large";
  usage?: "basic" | "work" | "gaming" | "creative";
  mobility?: "desktop" | "portable" | "ultraportable";
}

interface ComparisonAttribute {
  key: string;
  label: string;
  getValue: (product: Product) => number;
  format: (value: number) => string;
  higherIsBetter: boolean;
}

const COMPARISON_ATTRIBUTES: ComparisonAttribute[] = [
  {
    key: "price",
    label: "Price",
    getValue: (p) => p.price,
    format: (v) => `$${v.toLocaleString("en-US")}`,
    higherIsBetter: false,
  },
  {
    key: "rating",
    label: "Rating",
    getValue: (p) => p.rating,
    format: (v) => `${v}/5`,
    higherIsBetter: true,
  },
  {
    key: "ram",
    label: "RAM",
    getValue: (p) => p.ram_gb,
    format: (v) => `${v}GB`,
    higherIsBetter: true,
  },
  {
    key: "storage",
    label: "Storage",
    getValue: (p) => p.storage_gb,
    format: (v) => `${v}GB`,
    higherIsBetter: true,
  },
  {
    key: "screen",
    label: "Screen Size",
    getValue: (p) => p.screen_inch,
    format: (v) => `${v}"`,
    higherIsBetter: true,
  },
  {
    key: "battery",
    label: "Battery",
    getValue: (p) => p.battery_wh,
    format: (v) => `${v}Wh`,
    higherIsBetter: true,
  },
  {
    key: "weight",
    label: "Weight",
    getValue: (p) => p.weight_kg,
    format: (v) => `${v}kg`,
    higherIsBetter: false,
  },
];

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

export function EnhancedComparisonView({
  products,
  comparisonSummary,
  onRegenerateWithPreferences,
}: EnhancedComparisonViewProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(
    COMPARISON_ATTRIBUTES.slice(0, 5).map((attr) => attr.key)
  );
  const [showPreferences, setShowPreferences] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});

  const comparisonResults = useMemo(() => {
    if (products.length < 2) return null;

    const results: Record<
      string,
      { productId: string; status: "winner" | "loser" | "tie" }[]
    > = {};
    const productWins: Record<string, number> = {};

    // Initialize win counts
    products.forEach((product) => {
      productWins[product.id] = 0;
    });

    selectedAttributes.forEach((attrKey) => {
      const attribute = COMPARISON_ATTRIBUTES.find(
        (attr) => attr.key === attrKey
      );
      if (!attribute) return;

      const values = products.map((product) => ({
        productId: product.id,
        value: attribute.getValue(product),
      }));

      // Find best value
      const bestValue = attribute.higherIsBetter
        ? Math.max(...values.map((v) => v.value))
        : Math.min(...values.map((v) => v.value));

      // Determine winners and losers
      results[attrKey] = values.map(({ productId, value }) => {
        if (value === bestValue) {
          productWins[productId]++;
          return { productId, status: "winner" as const };
        }
        return { productId, status: "loser" as const };
      });
    });

    return { results, productWins };
  }, [products, selectedAttributes]);

  const pieChartData = useMemo(() => {
    if (!comparisonResults) return [];

    return products.map((product, index) => {
      // Create a shorter, more readable name for the chart
      const shortName =
        product.name.length > 25
          ? `${product.name.substring(0, 25)}...`
          : product.name;

      return {
        name: shortName,
        value: comparisonResults.productWins[product.id],
        color: COLORS[index % COLORS.length],
        fullName: product.name, // Keep full name for tooltips
      };
    });
  }, [products, comparisonResults]);

  const recommendedProduct = useMemo(() => {
    if (!comparisonResults) return null;

    const maxWins = Math.max(...Object.values(comparisonResults.productWins));
    const winnerId = Object.entries(comparisonResults.productWins).find(
      ([, wins]) => wins === maxWins
    )?.[0];

    return winnerId ? products.find((p) => p.id === winnerId) : null;
  }, [products, comparisonResults]);

  const getAttributeStatus = (productId: string, attrKey: string) => {
    if (!comparisonResults?.results[attrKey]) return "tie";
    return (
      comparisonResults.results[attrKey].find((r) => r.productId === productId)
        ?.status || "tie"
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "winner":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "loser":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "winner":
        return "text-green-600 font-semibold";
      case "loser":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (products.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Add at least 2 products to see detailed comparison.
        </p>
      </div>
    );
  }

  const handleRegenerateComparison = () => {
    if (onRegenerateWithPreferences) {
      onRegenerateWithPreferences(userPreferences);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Comparison</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* User Preferences Panel */}
      {showPreferences && (
        <Card>
          <CardHeader>
            <CardTitle>Customize Your Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Budget Range</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={userPreferences.budget || ""}
                  onChange={(e) =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      budget:
                        (e.target.value as "low" | "medium" | "high") ||
                        undefined,
                    }))
                  }
                >
                  <option value="">Any budget</option>
                  <option value="low">Budget-friendly</option>
                  <option value="medium">Mid-range</option>
                  <option value="high">Premium</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Screen Size</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={userPreferences.screenSize || ""}
                  onChange={(e) =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      screenSize:
                        (e.target.value as "compact" | "standard" | "large") ||
                        undefined,
                    }))
                  }
                >
                  <option value="">Any size</option>
                  <option value="compact">Compact (≤14&quot;)</option>
                  <option value="standard">Standard (15&quot;)</option>
                  <option value="large">Large (≥16&quot;)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Primary Usage</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={userPreferences.usage || ""}
                  onChange={(e) =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      usage:
                        (e.target.value as
                          | "basic"
                          | "work"
                          | "gaming"
                          | "creative") || undefined,
                    }))
                  }
                >
                  <option value="">General use</option>
                  <option value="basic">Basic tasks</option>
                  <option value="work">Work/Office</option>
                  <option value="gaming">Gaming</option>
                  <option value="creative">Creative work</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Mobility</label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={userPreferences.mobility || ""}
                  onChange={(e) =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      mobility:
                        (e.target.value as
                          | "desktop"
                          | "portable"
                          | "ultraportable") || undefined,
                    }))
                  }
                >
                  <option value="">No preference</option>
                  <option value="desktop">Desktop setup</option>
                  <option value="portable">Portable</option>
                  <option value="ultraportable">Ultra-portable</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleRegenerateComparison}>
                Generate Custom Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isMinimized && (
        <>
          {/* Attribute Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparison Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMPARISON_ATTRIBUTES.map((attr) => (
                  <Button
                    key={attr.key}
                    variant={
                      selectedAttributes.includes(attr.key)
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setSelectedAttributes((prev) =>
                        prev.includes(attr.key)
                          ? prev.filter((k) => k !== attr.key)
                          : [...prev, attr.key]
                      );
                    }}
                  >
                    {attr.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-muted mb-4">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <CardTitle className="text-lg">{product.brand}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedAttributes.map((attrKey) => {
                      const attribute = COMPARISON_ATTRIBUTES.find(
                        (attr) => attr.key === attrKey
                      );
                      if (!attribute) return null;

                      const value = attribute.getValue(product);
                      const status = getAttributeStatus(product.id, attrKey);

                      return (
                        <div
                          key={attrKey}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {attribute.label}:
                          </span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span
                              className={`text-sm ${getStatusColor(status)}`}
                            >
                              {attribute.format(value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {comparisonResults && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Wins:</span>
                        <span className="text-lg font-bold text-primary">
                          {comparisonResults.productWins[product.id]}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pie Chart Summary */}
          {comparisonResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Comparison Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value} wins`,
                            props.payload.fullName || props.payload.name,
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-4">
                      Performance Breakdown
                    </h3>
                    <div className="space-y-2">
                      {pieChartData
                        .sort((a, b) => b.value - a.value)
                        .map((item, index) => (
                          <div
                            key={`${item.name}-${index}`}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {item.value} wins
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Verdict */}
          {recommendedProduct && comparisonResults && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Trophy className="h-5 w-5" />
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800 dark:text-green-200">
                  Based on our comparison,{" "}
                  <strong>{recommendedProduct.brand}</strong> is the recommended
                  choice, outperforming other products in{" "}
                  <strong>
                    {comparisonResults.productWins[recommendedProduct.id]}
                  </strong>{" "}
                  out of <strong>{selectedAttributes.length}</strong> key
                  attributes.
                </p>
                {comparisonSummary && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">
                      AI Analysis:
                    </h4>
                    <div className="prose prose-sm max-w-none text-green-800 dark:text-green-200">
                      {comparisonSummary.split("\n").map((paragraph, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
