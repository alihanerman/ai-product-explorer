"use client";

import { useState, useEffect } from "react";
import { X, Clock, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface AiLog {
  id: string;
  createdAt: string;
  prompt: string;
  response: string;
  modelUsed: string;
}

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }
      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Comparison Logs</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchLogs} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No AI comparison logs found.</p>
              <p className="text-sm mt-2">
                Logs will appear here after you generate product comparisons.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(log.createdAt).toLocaleString("en-US")}
                      </CardTitle>
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {log.modelUsed}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Prompt
                        </span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded text-sm max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {log.prompt}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Response
                        </span>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded text-sm max-h-48 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          {log.response.split("\n").map((line, index) => (
                            <p key={index} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
