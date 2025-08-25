"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Trophy,
  Award,
  Info,
  ChevronRight,
  Sparkles,
  Target,
} from "lucide-react";

interface AIRecommendationDisplayProps {
  content: string;
}

interface ParsedContent {
  exclusionNotice?: string;
  quickTable?: string;
  winners?: Array<{ category: string; product: string; reason: string }>;
  strengths?: Array<{ product: string; points: string[] }>;
  weaknesses?: Array<{ product: string; points: string[] }>;
  verdict?: Array<{ value: string; choice: string; reason: string }>;
  summary?: string;
}

export function AIRecommendationDisplay({
  content,
}: AIRecommendationDisplayProps) {
  const parsedContent = useMemo(() => {
    const lines = content.split("\n").filter((line) => line.trim());
    const parsed: ParsedContent = {};

    let currentSection = "";
    let sectionType = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect section headers
      if (
        line.toLowerCase().includes("heads-up") ||
        line.toLowerCase().includes("focusing")
      ) {
        parsed.exclusionNotice = line;
        continue;
      }

      if (
        line.includes("|") &&
        (line.includes("Product") || line.includes("Price"))
      ) {
        sectionType = "table";
        currentSection = line + "\n";
        continue;
      }

      if (
        line.toLowerCase().includes("who wins") ||
        line.startsWith("### Who") ||
        line.toLowerCase().includes("wins for you")
      ) {
        sectionType = "winners";
        continue;
      }

      if (
        line.toLowerCase().includes("strengths") ||
        line.toLowerCase().includes("pros")
      ) {
        sectionType = "strengths";
        continue;
      }

      if (
        line.toLowerCase().includes("weaknesses") ||
        line.toLowerCase().includes("cons")
      ) {
        sectionType = "weaknesses";
        continue;
      }

      if (
        line.toLowerCase().includes("verdict") ||
        line.includes("If you value")
      ) {
        sectionType = "verdict";
        if (line.includes("|")) {
          currentSection = line + "\n";
          continue;
        }
      }

      // Process content based on section type
      if (sectionType === "table" && line.includes("|")) {
        currentSection += line + "\n";
        if (i === lines.length - 1 || !lines[i + 1]?.includes("|")) {
          parsed.quickTable = currentSection;
          currentSection = "";
          sectionType = "";
        }
        continue;
      }

      if (sectionType === "verdict" && line.includes("|")) {
        currentSection += line + "\n";
        if (i === lines.length - 1 || !lines[i + 1]?.includes("|")) {
          parsed.verdict = parseVerdictTable(currentSection);
          currentSection = "";
          sectionType = "";
        }
        continue;
      }

      if (
        sectionType === "winners" &&
        (line.startsWith("-") || line.startsWith("*"))
      ) {
        if (!parsed.winners) parsed.winners = [];

        // Try to extract category and product from patterns like:
        // - **For Budget:** The **Product Name** is the clear winner.
        // - **For Gaming:** The **Product Name** with its superior RAM is your best bet.
        const categoryMatch = line.match(/\*\*For\s+(.*?)[\s:]*\*\*/i);
        const productMatch = line.match(/The\s+\*\*(.*?)\*\*/i);

        if (categoryMatch && productMatch) {
          parsed.winners.push({
            category: categoryMatch[1],
            product: productMatch[1],
            reason: line.replace(/^[-*]\s*/, "").replace(/\*\*/g, ""),
          });
        } else {
          // Fallback: try to find any two bold text patterns
          const allMatches = line.match(/\*\*(.*?)\*\*/g);
          if (allMatches && allMatches.length >= 2) {
            parsed.winners.push({
              category: allMatches[0].replace(/\*\*/g, ""),
              product: allMatches[1].replace(/\*\*/g, ""),
              reason: line.replace(/^[-*]\s*/, "").replace(/\*\*/g, ""),
            });
          }
        }
        continue;
      }

      // Collect remaining content as summary
      if (!sectionType && line.length > 0) {
        parsed.summary = (parsed.summary || "") + line + " ";
      }
    }

    return parsed;
  }, [content]);

  const parseVerdictTable = (tableContent: string) => {
    const rows = tableContent
      .trim()
      .split("\n")
      .filter((row) => row.trim());
    if (rows.length < 3) return [];

    const dataRows = rows.slice(2);
    return dataRows
      .map((row) => {
        const cells = row
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell);
        if (cells.length >= 3) {
          return {
            value: cells[0].replace(/\*\*/g, ""),
            choice: cells[1].replace(/\*\*/g, ""),
            reason: cells[2].replace(/\*\*/g, ""),
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{
      value: string;
      choice: string;
      reason: string;
    }>;
  };

  return (
    <div className="space-y-6">
      {/* Exclusion Notice */}
      {parsedContent.exclusionNotice && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                {parsedContent.exclusionNotice}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winners Section */}
      {parsedContent.winners && parsedContent.winners.length > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Trophy className="h-5 w-5" />
              Category Winners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedContent.winners.map((winner, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      {winner.category}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {winner.product}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {winner.reason.replace(/\*\*/g, "")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Final Verdict */}
      {parsedContent.verdict && parsedContent.verdict.length > 0 && (
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-700 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2 text-green-700 dark:text-green-300">
              <Target className="h-6 w-6" />
              Final Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedContent.verdict.map((item, index) => (
              <div
                key={index}
                className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        If you value{" "}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {item.value}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Choose{" "}
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                        {item.choice}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fallback: Show raw content if nothing was parsed */}
      {!parsedContent.winners?.length &&
        !parsedContent.verdict?.length &&
        !parsedContent.exclusionNotice && (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Sparkles className="h-5 w-5" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content
                .split("\n\n")
                .filter((para) => para.trim())
                .map((paragraph, index) => (
                  <div
                    key={index}
                    className="prose prose-gray dark:prose-invert max-w-none"
                  >
                    <p
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: paragraph
                          .trim()
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="font-semibold">$1</strong>'
                          ),
                      }}
                    />
                  </div>
                ))}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
