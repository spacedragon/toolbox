import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HashResult {
  algorithm: string;
  input: string;
  hash: string;
  inputSize: number;
  isValid: boolean;
  error?: string;
}

const HashGenerator: React.FC = () => {
  const [textInput, setTextInput] = useState('Hello, World! This is a sample text for hash generation.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(['MD5', 'SHA-1', 'SHA-256']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const algorithms = [
    { id: 'MD5', name: 'MD5', description: '128-bit hash (deprecated for security)' },
    { id: 'SHA-1', name: 'SHA-1', description: '160-bit hash (deprecated for security)' },
    { id: 'SHA-256', name: 'SHA-256', description: '256-bit hash (recommended)' },
    { id: 'SHA-512', name: 'SHA-512', description: '512-bit hash (most secure)' },
  ];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        setTextInput('');
        setSelectedFile(null);
        setFileContent(null);
      }
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as ArrayBuffer;
      setFileContent(result);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const toggleAlgorithm = useCallback((algorithm: string) => {
    setSelectedAlgorithms(prev => 
      prev.includes(algorithm)
        ? prev.filter(a => a !== algorithm)
        : [...prev, algorithm]
    );
  }, []);

  // Simple MD5 implementation for demonstration
  const md5 = (input: string): string => {
    // This is a simplified version - in a real app, use crypto-js or similar
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  };

  const generateHash = async (data: string | ArrayBuffer, algorithm: string): Promise<string> => {
    try {
      let input: Uint8Array;
      
      if (typeof data === 'string') {
        input = new TextEncoder().encode(data);
      } else {
        input = new Uint8Array(data);
      }

      // For demo purposes, using a simple hash for MD5
      if (algorithm === 'MD5') {
        const text = typeof data === 'string' ? data : new TextDecoder().decode(input);
        return md5(text);
      }

      // Use Web Crypto API for SHA algorithms
      const cryptoAlgorithm = algorithm === 'SHA-1' ? 'SHA-1' : 
                             algorithm === 'SHA-256' ? 'SHA-256' : 
                             algorithm === 'SHA-512' ? 'SHA-512' : 'SHA-256';

      const hashBuffer = await crypto.subtle.digest(cryptoAlgorithm, input);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hash generation error:', error);
      return 'Error generating hash';
    }
  };

  const textHashes = useMemo(async (): Promise<HashResult[]> => {
    if (!textInput.trim()) return [];

    const results: HashResult[] = [];
    
    for (const algorithm of selectedAlgorithms) {
      try {
        const hash = await generateHash(textInput, algorithm);
        results.push({
          algorithm,
          input: textInput,
          hash,
          inputSize: textInput.length,
          isValid: true
        });
      } catch (error: any) {
        results.push({
          algorithm,
          input: textInput,
          hash: '',
          inputSize: textInput.length,
          isValid: false,
          error: error.message
        });
      }
    }
    
    return results;
  }, [textInput, selectedAlgorithms]);

  const fileHashes = useMemo(async (): Promise<HashResult[]> => {
    if (!fileContent || !selectedFile) return [];

    const results: HashResult[] = [];
    
    for (const algorithm of selectedAlgorithms) {
      try {
        const hash = await generateHash(fileContent, algorithm);
        results.push({
          algorithm,
          input: selectedFile.name,
          hash,
          inputSize: selectedFile.size,
          isValid: true
        });
      } catch (error: any) {
        results.push({
          algorithm,
          input: selectedFile.name,
          hash: '',
          inputSize: selectedFile.size,
          isValid: false,
          error: error.message
        });
      }
    }
    
    return results;
  }, [fileContent, selectedFile, selectedAlgorithms]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderHashResults = (hashPromise: Promise<HashResult[]>, title: string) => {
    const [results, setResults] = useState<HashResult[]>([]);
    
    React.useEffect(() => {
      hashPromise.then(setResults);
    }, [hashPromise]);

    if (results.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default">Hashes</Badge>
            <CardTitle>{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={result.isValid ? "outline" : "destructive"}>
                      {result.algorithm}
                    </Badge>
                    {result.isValid && (
                      <span className="text-sm text-muted-foreground">
                        {result.hash.length * 4} bits
                      </span>
                    )}
                  </div>
                  {result.isValid && (
                    <Button
                      onClick={() => copyToClipboard(result.hash)}
                      variant="outline"
                      size="sm"
                    >
                      Copy
                    </Button>
                  )}
                </div>
                
                {result.isValid ? (
                  <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto whitespace-pre-wrap break-all font-mono">
                    {result.hash}
                  </pre>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm text-destructive">{result.error}</div>
                  </div>
                )}
                
                {index < results.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Algorithm Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Settings</Badge>
            <CardTitle>Hash Algorithms</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which hash algorithms to generate
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {algorithms.map((algo) => (
                <div key={algo.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={algo.id}
                    checked={selectedAlgorithms.includes(algo.id)}
                    onChange={() => toggleAlgorithm(algo.id)}
                    className="mt-1 h-4 w-4 rounded border-input"
                  />
                  <div className="space-y-1">
                    <label htmlFor={algo.id} className="text-sm font-medium cursor-pointer">
                      {algo.name}
                    </label>
                    <p className="text-xs text-muted-foreground">{algo.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default">Text</Badge>
            <CardTitle>Text Hash Generator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter text to generate hash values • Press{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Ctrl+K
              </kbd>{' '}
              to clear all
            </p>
            <Badge variant="outline" className="text-xs">
              {textInput.length} chars
            </Badge>
          </div>
          
          <Textarea
            placeholder="Enter text to hash..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button onClick={() => setTextInput('')} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">File</Badge>
            <CardTitle>File Hash Generator</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a file to generate hash values
          </p>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Choose File
              </Button>
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted/30 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedFile.type || 'Unknown type'} • {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <Badge variant="default">Selected</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {textInput.trim() && selectedAlgorithms.length > 0 && 
        renderHashResults(textHashes, `Text Hashes (${textInput.length} characters)`)}
      
      {selectedFile && selectedAlgorithms.length > 0 && 
        renderHashResults(fileHashes, `File Hashes (${selectedFile.name})`)}
      
      {selectedAlgorithms.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Please select at least one hash algorithm to generate hashes.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HashGenerator;