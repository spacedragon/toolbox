import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface UrlResult {
  input: string;
  output: string;
  isValid: boolean;
  error?: string;
}

interface ParsedUrl {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  queryParams: { [key: string]: string };
}

const UrlTool: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://example.com/path/to/page?name=John Doe&email=john@example.com&tags=developer,designer&active=true#section1');
  const [encodedInput, setEncodedInput] = useState('');
  const [componentInput, setComponentInput] = useState('Hello World! @#$%^&*()');
  const [queryKey, setQueryKey] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [queryParams, setQueryParams] = useState<{ [key: string]: string }>({});

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        setUrlInput('');
        setEncodedInput('');
        setComponentInput('');
        setQueryParams({});
      }
    }
  }, []);

  const encodeUrl = useCallback((): UrlResult => {
    try {
      const encoded = encodeURI(urlInput);
      return {
        input: urlInput,
        output: encoded,
        isValid: true
      };
    } catch (error: any) {
      return {
        input: urlInput,
        output: '',
        isValid: false,
        error: error.message
      };
    }
  }, [urlInput]);

  const decodeUrl = useCallback((): UrlResult => {
    try {
      const decoded = decodeURI(encodedInput);
      return {
        input: encodedInput,
        output: decoded,
        isValid: true
      };
    } catch (error: any) {
      return {
        input: encodedInput,
        output: '',
        isValid: false,
        error: error.message
      };
    }
  }, [encodedInput]);

  const encodeComponent = useCallback((): UrlResult => {
    try {
      const encoded = encodeURIComponent(componentInput);
      return {
        input: componentInput,
        output: encoded,
        isValid: true
      };
    } catch (error: any) {
      return {
        input: componentInput,
        output: '',
        isValid: false,
        error: error.message
      };
    }
  }, [componentInput]);

  const parseUrl = useMemo((): ParsedUrl | null => {
    try {
      const url = new URL(urlInput);
      const queryParams: { [key: string]: string } = {};
      
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      return {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        queryParams
      };
    } catch {
      return null;
    }
  }, [urlInput]);

  const addQueryParam = useCallback(() => {
    if (queryKey.trim() && queryValue.trim()) {
      setQueryParams(prev => ({
        ...prev,
        [queryKey.trim()]: queryValue.trim()
      }));
      setQueryKey('');
      setQueryValue('');
    }
  }, [queryKey, queryValue]);

  const removeQueryParam = useCallback((key: string) => {
    setQueryParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  }, []);

  const buildUrlFromParams = useCallback((): string => {
    const baseUrl = 'https://example.com/path';
    const params = new URLSearchParams();
    
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [queryParams]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const encodedResult = encodeUrl();
  const decodedResult = decodeUrl();
  const componentResult = encodeComponent();

  return (
    <div className="space-y-6">
      {/* URL Encoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default">Encode</Badge>
            <CardTitle>URL Encoder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter a URL to encode special characters • Press{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Ctrl+K
              </kbd>{' '}
              to clear all
            </p>
            <Badge variant="outline" className="text-xs">
              {urlInput.length} chars
            </Badge>
          </div>
          
          <Textarea
            placeholder="Enter URL to encode..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button onClick={() => setUrlInput(encodedResult.output)} disabled={!urlInput.trim() || !encodedResult.isValid}>
              Apply Encoding
            </Button>
            <Button onClick={() => setUrlInput('')} variant="outline">
              Clear
            </Button>
          </div>

          {urlInput.trim() && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={encodedResult.isValid ? "default" : "destructive"}>
                    {encodedResult.isValid ? "Encoded" : "Error"}
                  </Badge>
                  {encodedResult.isValid && (
                    <Badge variant="outline" className="text-xs">
                      {encodedResult.output.length} chars
                    </Badge>
                  )}
                </div>
                
                {encodedResult.isValid ? (
                  <div className="space-y-2">
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto max-h-[150px] whitespace-pre-wrap break-all">
                      {encodedResult.output}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(encodedResult.output)}
                      variant="outline"
                      size="sm"
                    >
                      Copy Encoded URL
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm text-destructive">{encodedResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Decoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Decode</Badge>
            <CardTitle>URL Decoder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter an encoded URL to decode
            </p>
            <Badge variant="outline" className="text-xs">
              {encodedInput.length} chars
            </Badge>
          </div>
          
          <Textarea
            placeholder="Enter encoded URL to decode..."
            value={encodedInput}
            onChange={(e) => setEncodedInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button onClick={() => setEncodedInput(decodedResult.output)} disabled={!encodedInput.trim() || !decodedResult.isValid}>
              Apply Decoding
            </Button>
            <Button onClick={() => setEncodedInput('')} variant="outline">
              Clear
            </Button>
          </div>

          {encodedInput.trim() && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={decodedResult.isValid ? "default" : "destructive"}>
                    {decodedResult.isValid ? "Decoded" : "Error"}
                  </Badge>
                  {decodedResult.isValid && (
                    <Badge variant="outline" className="text-xs">
                      {decodedResult.output.length} chars
                    </Badge>
                  )}
                </div>
                
                {decodedResult.isValid ? (
                  <div className="space-y-2">
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto max-h-[150px] whitespace-pre-wrap break-all">
                      {decodedResult.output}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(decodedResult.output)}
                      variant="outline"
                      size="sm"
                    >
                      Copy Decoded URL
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm text-destructive">{decodedResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Encoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Component</Badge>
            <CardTitle>URL Component Encoder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Encode individual URL components (more aggressive than URL encoding)
          </p>
          
          <Input
            placeholder="Enter text to encode as URL component..."
            value={componentInput}
            onChange={(e) => setComponentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="font-mono text-sm"
          />
          
          <div className="flex space-x-2">
            <Button onClick={() => setComponentInput(componentResult.output)} disabled={!componentInput.trim() || !componentResult.isValid}>
              Apply Component Encoding
            </Button>
            <Button onClick={() => setComponentInput('')} variant="outline">
              Clear
            </Button>
          </div>

          {componentInput.trim() && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Badge variant={componentResult.isValid ? "default" : "destructive"}>
                  {componentResult.isValid ? "Encoded Component" : "Error"}
                </Badge>
                
                {componentResult.isValid ? (
                  <div className="space-y-2">
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto whitespace-pre-wrap break-all">
                      {componentResult.output}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(componentResult.output)}
                      variant="outline"
                      size="sm"
                    >
                      Copy Encoded Component
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm text-destructive">{componentResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* URL Parser Section */}
      {urlInput.trim() && parseUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="outline">Parse</Badge>
              <CardTitle>URL Parser</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Protocol</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono">
                    {parseUrl.protocol || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Hostname</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono">
                    {parseUrl.hostname || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Port</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono">
                    {parseUrl.port || '—'}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Pathname</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono">
                    {parseUrl.pathname || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Search</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono break-all">
                    {parseUrl.search || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Hash</div>
                  <div className="text-sm bg-muted/30 p-2 rounded font-mono">
                    {parseUrl.hash || '—'}
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(parseUrl.queryParams).length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Query Parameters</div>
                  <div className="space-y-2">
                    {Object.entries(parseUrl.queryParams).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        <Badge variant="outline" className="text-xs">{key}</Badge>
                        <span className="text-sm font-mono flex-1 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query String Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Builder</Badge>
            <CardTitle>Query String Builder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Build query strings by adding key-value pairs
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Key"
              value={queryKey}
              onChange={(e) => setQueryKey(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value"
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addQueryParam} disabled={!queryKey.trim() || !queryValue.trim()}>
              Add
            </Button>
          </div>

          {Object.keys(queryParams).length > 0 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Parameters</div>
                <div className="space-y-2">
                  {Object.entries(queryParams).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                      <Badge variant="outline" className="text-xs">{key}</Badge>
                      <span className="text-sm font-mono flex-1">{value}</span>
                      <Button
                        onClick={() => removeQueryParam(key)}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Generated URL</div>
                <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto whitespace-pre-wrap break-all">
                  {buildUrlFromParams()}
                </pre>
                <Button
                  onClick={() => copyToClipboard(buildUrlFromParams())}
                  variant="outline"
                  size="sm"
                >
                  Copy URL
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UrlTool;