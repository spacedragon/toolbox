import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface JsonValidationResult {
  isValid: boolean;
  error?: string;
  lineNumber?: number;
  formatted?: string;
  minified?: string;
  size: number;
  compressedSize?: number;
}

const JsonFormatter: React.FC = () => {
  const [jsonInput, setJsonInput] = useState(`{
  "name": "John Doe",
  "age": 30,
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "hobbies": ["reading", "photography", "coding"],
  "isActive": true,
  "metadata": {
    "created": "2024-01-15T10:30:45.123Z",
    "lastModified": null,
    "tags": ["user", "premium"]
  }
}`);
  
  const [indentSize, setIndentSize] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        setJsonInput('');
      }
    }
  }, []);

  const validationResult = useMemo((): JsonValidationResult => {
    const trimmed = jsonInput.trim();
    if (!trimmed) {
      return { isValid: true, size: 0 };
    }

    try {
      const parsed = JSON.parse(trimmed);
      
      // Format with proper indentation
      const formatted = JSON.stringify(
        sortKeys ? sortObjectKeys(parsed) : parsed, 
        null, 
        indentSize
      );
      
      // Minify
      const minified = JSON.stringify(
        sortKeys ? sortObjectKeys(parsed) : parsed
      );

      return {
        isValid: true,
        formatted,
        minified,
        size: trimmed.length,
        compressedSize: minified.length
      };
    } catch (error: any) {
      // Try to extract line number from error message
      const lineMatch = error.message.match(/position (\d+)/);
      let lineNumber: number | undefined;
      
      if (lineMatch) {
        const position = parseInt(lineMatch[1]);
        const lines = trimmed.substring(0, position).split('\n');
        lineNumber = lines.length;
      }

      return {
        isValid: false,
        error: error.message,
        lineNumber,
        size: trimmed.length
      };
    }
  }, [jsonInput, indentSize, sortKeys]);

  const sortObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sortedObj: any = {};
      Object.keys(obj).sort().forEach(key => {
        sortedObj[key] = sortObjectKeys(obj[key]);
      });
      return sortedObj;
    }
    
    return obj;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatJson = () => {
    if (validationResult.isValid && validationResult.formatted) {
      setJsonInput(validationResult.formatted);
    }
  };

  const minifyJson = () => {
    if (validationResult.isValid && validationResult.minified) {
      setJsonInput(validationResult.minified);
    }
  };

  const getValidationIcon = () => {
    if (!jsonInput.trim()) return null;
    return validationResult.isValid ? '✅' : '❌';
  };

  const getCompressionRatio = () => {
    if (validationResult.size && validationResult.compressedSize) {
      const ratio = ((validationResult.size - validationResult.compressedSize) / validationResult.size * 100);
      return ratio.toFixed(1);
    }
    return '0';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="default">Input</Badge>
              <CardTitle>JSON Input</CardTitle>
              {getValidationIcon() && (
                <span className="text-lg">{getValidationIcon()}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {validationResult.size} chars
              </Badge>
              {validationResult.compressedSize && (
                <Badge variant="outline" className="text-xs">
                  -{getCompressionRatio()}% compressed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Paste or type your JSON here • Press{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Ctrl+K
              </kbd>{' '}
              to clear
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Indent:</label>
                <select
                  value={indentSize}
                  onChange={(e) => setIndentSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                  <option value={8}>8 spaces</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sortKeys"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="sortKeys" className="text-sm font-medium">
                  Sort keys
                </label>
              </div>
            </div>
          </div>
          
          <Textarea
            placeholder="Paste your JSON here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[300px] font-mono text-sm resize-none"
          />
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={formatJson}
              disabled={!validationResult.isValid}
              variant="default"
            >
              Format
            </Button>
            <Button
              onClick={minifyJson}
              disabled={!validationResult.isValid}
              variant="outline"
            >
              Minify
            </Button>
            <Button
              onClick={() => setJsonInput('')}
              variant="outline"
            >
              Clear
            </Button>
            {validationResult.formatted && (
              <Button
                onClick={() => copyToClipboard(validationResult.formatted!)}
                variant="outline"
              >
                Copy Formatted
              </Button>
            )}
            {validationResult.minified && (
              <Button
                onClick={() => copyToClipboard(validationResult.minified!)}
                variant="outline"
              >
                Copy Minified
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {jsonInput.trim() && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? "Valid" : "Invalid"}
              </Badge>
              <CardTitle>Validation Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {validationResult.isValid ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Size</div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {validationResult.size} chars
                    </Badge>
                  </div>
                  {validationResult.compressedSize && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Minified Size</div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {validationResult.compressedSize} chars
                      </Badge>
                    </div>
                  )}
                  {validationResult.compressedSize && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Compression</div>
                      <Badge variant="default" className="text-lg px-3 py-1">
                        -{getCompressionRatio()}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="text-sm text-muted-foreground">
                  ✅ JSON is valid and properly formatted
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-destructive text-lg">❌</span>
                    <div className="space-y-2">
                      <div className="font-medium text-destructive">JSON Validation Error</div>
                      <div className="text-sm text-destructive/80">
                        {validationResult.error}
                      </div>
                      {validationResult.lineNumber && (
                        <Badge variant="destructive" className="text-xs">
                          Near line {validationResult.lineNumber}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Section - Only show if valid and formatted */}
      {validationResult.isValid && validationResult.formatted && jsonInput.trim() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formatted Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="default">Formatted</Badge>
                <CardTitle className="text-lg">Pretty Print</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
                {validationResult.formatted}
              </pre>
              <div className="mt-4">
                <Button
                  onClick={() => copyToClipboard(validationResult.formatted!)}
                  variant="outline"
                  size="sm"
                >
                  Copy Formatted
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Minified Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Minified</Badge>
                <CardTitle className="text-lg">Compact</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted/30 p-4 rounded-md overflow-auto max-h-[400px] whitespace-pre-wrap break-all">
                {validationResult.minified}
              </pre>
              <div className="mt-4">
                <Button
                  onClick={() => copyToClipboard(validationResult.minified!)}
                  variant="outline"
                  size="sm"
                >
                  Copy Minified
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JsonFormatter;