import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LogEntry {
  [key: string]: any;
}

interface ParsedLogEntry {
  original: string;
  parsed: LogEntry | null;
  isJson: boolean;
  index: number;
}

const LogViewer: React.FC = () => {
  const [logInput, setLogInput] = useState(`{"timestamp":"2024-01-15T10:30:45.123Z","level":"info","message":"Application started successfully","service":"web-server","user_id":"user_123","request_id":"req_001","version":"1.2.3","port":8080}
{"timestamp":"2024-01-15T10:30:46.234Z","level":"warn","message":"Database connection pool is running low\\nRecommendation: Scale up the connection pool\\nCurrent utilization: 95%","service":"db-service","user_id":"user_456","request_id":"req_002","pool_size":5,"max_pool_size":20}
{"timestamp":"2024-01-15T10:30:47.345Z","level":"error","message":"Failed to process user request","service":"auth-service","user_id":"user_789","request_id":"req_003","error":"Connection timeout","stack_trace":"at auth.validateToken() line 78\\n\\tat handlers.authenticateUser() line 142\\n\\tat http.ServeHTTP() line 89","file":"handlers/user.go","line":142}
{"timestamp":"2024-01-15T10:30:48.456Z","level":"debug","message":"Cache hit for user profile","service":"cache-service","user_id":"user_123","request_id":"req_004","cache_key":"user:123:profile","response_time_ms":23}
{"timestamp":"2024-01-15T10:30:49.567Z","level":"info","message":"Payment processed successfully\\nTransaction ID: txn_abc123\\nProcessor: Stripe","service":"payment-service","user_id":"user_456","request_id":"req_005","payment_id":"pay_789","amount":99.99,"currency":"USD","metadata":"{\\"customer_id\\": \\"cust_456\\", \\"plan\\": \\"premium\\"}"}
{"timestamp":"2024-01-15T10:30:50.678Z","level":"warn","message":"Rate limit exceeded","service":"api-gateway","user_id":"user_999","request_id":"req_006","api_key":"key_abc123","rate_limit":1000,"current_count":1001,"details":"Client has exceeded the hourly rate limit\\nNext reset: 2024-01-15T11:00:00Z\\nContact support for rate limit increase"}

2024-01-15T10:30:51.789Z INFO [notification-service] Email sent successfully to user@example.com
2024-01-15T10:30:52.890Z ERROR [backup-service] Failed to upload backup file: storage quota exceeded
Please contact system administrator
File size: 2.5GB, Available space: 500MB
Multi-line plain text log entry
that demonstrates how the new layout
handles non-JSON content properly`);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "a") {
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setLogInput("");
      }
    }
  }, []);

  const parsedLogs = useMemo(() => {
    if (!logInput.trim()) return [];

    const lines = logInput.split("\n").filter((line) => line.trim());

    return lines.map((line, index): ParsedLogEntry => {
      try {
        const trimmedLine = line.trim();
        if (!trimmedLine)
          return { original: line, parsed: null, isJson: false, index };

        const parsed = JSON.parse(trimmedLine);
        if (typeof parsed !== "object" || parsed === null) {
          return { original: line, parsed: null, isJson: false, index };
        }

        return {
          original: line,
          parsed,
          isJson: true,
          index,
        };
      } catch (error) {
        return {
          original: line,
          parsed: null,
          isJson: false,
          index,
        };
      }
    });
  }, [logInput]);

  // Get shared keys (keys that appear in multiple log entries) and extra keys
  const { sharedKeys, getExtraKeys } = useMemo(() => {
    const keyFrequency = new Map<string, number>();
    const jsonLogCount = parsedLogs.filter((log) => log.isJson).length;

    // Count frequency of each key
    parsedLogs.forEach((log) => {
      if (log.isJson && log.parsed) {
        Object.keys(log.parsed).forEach((key) => {
          keyFrequency.set(key, (keyFrequency.get(key) || 0) + 1);
        });
      }
    });

    // Consider a key "shared" if it appears in at least 2 logs or 50% of logs
    const threshold = Math.max(2, Math.ceil(jsonLogCount * 0.5));
    const shared = Array.from(keyFrequency.entries())
      .filter(([, count]) => count >= threshold)
      .map(([key]) => key);

    // Sort shared keys to put common ones first
    const commonKeys = ["timestamp", "time", "level", "message", "service"];
    const priorityKeys = commonKeys.filter((key) => shared.includes(key));
    const otherSharedKeys = shared
      .filter((key) => !commonKeys.includes(key))
      .sort();
    const finalSharedKeys = [...priorityKeys, ...otherSharedKeys];

    // Function to get extra keys for a specific log entry
    const getExtraKeys = (logEntry: ParsedLogEntry): { [key: string]: any } => {
      if (!logEntry.isJson || !logEntry.parsed) return {};

      const extraKeys: { [key: string]: any } = {};
      Object.entries(logEntry.parsed).forEach(([key, value]) => {
        if (!finalSharedKeys.includes(key)) {
          extraKeys[key] = value;
        }
      });
      return extraKeys;
    };

    return { sharedKeys: finalSharedKeys, getExtraKeys };
  }, [parsedLogs]);

  const formatValue = (value: any): string => {
    if (typeof value === "string") {
      return value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const isTimestamp = (key: string, value: any): boolean => {
    const timestampKeys = [
      "timestamp",
      "time",
      "ts",
      "date",
      "datetime",
      "@timestamp",
    ];
    return (
      timestampKeys.some((k) => key.toLowerCase().includes(k.toLowerCase())) ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    );
  };

  const isLogLevel = (key: string, value: any): boolean => {
    const levelKeys = ["level", "severity", "priority", "loglevel"];
    const levelValues = [
      "error",
      "warn",
      "warning",
      "info",
      "debug",
      "trace",
      "fatal",
    ];
    return (
      levelKeys.some((k) => key.toLowerCase().includes(k.toLowerCase())) ||
      (typeof value === "string" && levelValues.includes(value.toLowerCase()))
    );
  };

  const isCodeLine = (key: string): boolean => {
    const codeKeys = [
      "line",
      "lineno",
      "linenumber",
      "file",
      "filename",
      "source",
      "location",
    ];
    return codeKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()));
  };

  const getCellClassName = (key: string, value: any): string => {
    let className = "text-sm max-w-xs truncate";

    if (isTimestamp(key, value)) {
      className += " text-blue-600 font-mono";
    } else if (isLogLevel(key, value)) {
      const level = String(value).toLowerCase();
      if (level.includes("error") || level.includes("fatal")) {
        className += " text-red-600 font-semibold";
      } else if (level.includes("warn")) {
        className += " text-yellow-600 font-semibold";
      } else if (level.includes("info")) {
        className += " text-green-600 font-semibold";
      } else {
        className += " text-gray-600";
      }
    } else if (isCodeLine(key)) {
      className += " text-purple-600 font-mono";
    }

    return className;
  };

  const handleRowClick = (index: number) => {
    setSelectedRow(selectedRow === index ? null : index);

    // Toggle expansion when row is clicked
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const renderExpandedRow = (entry: ParsedLogEntry) => {
    if (!entry.isJson || !entry.parsed) {
      return (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Raw Content</Badge>
              <CardTitle className="text-lg">Plain Text Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-1/4 min-w-[120px] flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  raw_content
                </Badge>
              </div>
              <div className="w-3/4 flex-grow">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono break-words bg-muted/30 p-3 rounded-md">
                  {entry.original}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge>JSON</Badge>
            <CardTitle className="text-lg">Detailed View</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(entry.parsed).map(([key, value], index) => (
              <div key={key}>
                <div className="flex gap-4">
                  <div className="w-1/4 min-w-[120px] flex-shrink-0">
                    <Badge 
                      variant={isTimestamp(key, value) ? "default" : 
                               isLogLevel(key, value) ? "destructive" : 
                               isCodeLine(key) ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {key}
                    </Badge>
                  </div>
                  <div className="w-3/4 flex-grow">
                    <div
                      className={getCellClassName(key, value)
                        .replace("truncate", "")
                        .replace("max-w-xs", "")}
                    >
                      <pre className="whitespace-pre-wrap break-words font-inherit text-sm bg-muted/30 p-3 rounded-md">
                        {formatValue(value)}
                      </pre>
                    </div>
                  </div>
                </div>
                {entry.parsed && index < Object.entries(entry.parsed).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default">Input</Badge>
            <CardTitle>Log Input</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Paste your structured JSON log messages here (one per line) •
              Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Ctrl+K</kbd> to clear
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={() => setExpandedRows(new Set())}
                variant="outline"
                size="sm"
              >
                Collapse All
              </Button>
              <Button
                onClick={() => setLogInput("")}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Paste your structured log messages here (one per line)..."
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[150px] font-mono text-sm resize-none"
          />
        </CardContent>
      </Card>

      {parsedLogs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{parsedLogs.length}</Badge>
                <CardTitle>Log Table</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {sharedKeys.length} columns
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {parsedLogs.filter(log => log.isJson).length} JSON
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {parsedLogs.filter(log => !log.isJson).length} text
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {sharedKeys.map((key) => (
                      <TableHead key={key} className="min-w-[120px]">
                        {key}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[120px]">Extra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLogs.map((entry, index) => (
                    <React.Fragment key={index}>
                      <TableRow
                        className={`cursor-pointer ${selectedRow === index ? "bg-blue-50" : ""} ${
                          entry.isJson
                            ? "hover:bg-gray-50"
                            : "hover:bg-yellow-50"
                        } ${expandedRows.has(index) ? "border-b-2 border-blue-200" : ""}`}
                        onClick={() => handleRowClick(index)}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>{index + 1}</span>
                            {expandedRows.has(index) && (
                              <Badge variant="default" className="h-4 w-4 p-0 text-[10px]">▼</Badge>
                            )}
                          </div>
                        </TableCell>
                        {sharedKeys.map((key) => (
                          <TableCell key={key}>
                            {entry.isJson &&
                            entry.parsed &&
                            entry.parsed[key] !== undefined ? (
                              <div
                                className={getCellClassName(
                                  key,
                                  entry.parsed[key],
                                )}
                                title={formatValue(entry.parsed[key])}
                              >
                                {formatValue(entry.parsed[key])}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          {(() => {
                            const extraKeys = getExtraKeys(entry);
                            const extraCount = Object.keys(extraKeys).length;
                            if (extraCount === 0) {
                              return <span className="text-gray-400">—</span>;
                            }

                            const formatExtraValue = (value: any): string => {
                              if (typeof value === "object") {
                                return JSON.stringify(value);
                              }
                              const str = String(value);
                              return str.length > 20
                                ? str.substring(0, 20) + "..."
                                : str;
                            };

                            const keyValuePairs = Object.entries(extraKeys)
                              .slice(0, 2)
                              .map(
                                ([key, value]) =>
                                  `${key}:${formatExtraValue(value)}`,
                              );
                            const preview = keyValuePairs.join(", ");
                            const displayText =
                              extraCount > 2
                                ? `${preview} +${extraCount - 2}`
                                : preview;
                            const tooltipText = Object.entries(extraKeys)
                              .map(
                                ([key, value]) =>
                                  `${key}: ${typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}`,
                              )
                              .join("\n");
                            return (
                              <div
                                className="text-sm text-muted-foreground truncate"
                                title={tooltipText}
                              >
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {displayText}
                                </code>
                              </div>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(index) && (
                        <TableRow>
                          <TableCell colSpan={sharedKeys.length + 2}>
                            {renderExpandedRow(entry)}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LogViewer;
