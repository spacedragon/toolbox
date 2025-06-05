import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Base64Result {
  input: string;
  output: string;
  inputSize: number;
  outputSize: number;
  isValid: boolean;
  error?: string;
}

const Base64Tool: React.FC = () => {
  const [textInput, setTextInput] = useState('Hello, World! This is a sample text for Base64 encoding.');
  const [base64Input, setBase64Input] = useState('');
  const [encodedResult, setEncodedResult] = useState<Base64Result | null>(null);
  const [decodedResult, setDecodedResult] = useState<Base64Result | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        setTextInput('');
        setBase64Input('');
        setEncodedResult(null);
        setDecodedResult(null);
      }
    }
  }, []);

  const encodeToBase64 = useCallback(() => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(textInput)));
      setEncodedResult({
        input: textInput,
        output: encoded,
        inputSize: textInput.length,
        outputSize: encoded.length,
        isValid: true
      });
    } catch (error: any) {
      setEncodedResult({
        input: textInput,
        output: '',
        inputSize: textInput.length,
        outputSize: 0,
        isValid: false,
        error: error.message
      });
    }
  }, [textInput]);

  const decodeFromBase64 = useCallback(() => {
    try {
      // Remove whitespace and newlines
      const cleanBase64 = base64Input.replace(/\s+/g, '');
      
      // Validate Base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanBase64)) {
        throw new Error('Invalid Base64 format');
      }

      const decoded = decodeURIComponent(escape(atob(cleanBase64)));
      setDecodedResult({
        input: base64Input,
        output: decoded,
        inputSize: base64Input.length,
        outputSize: decoded.length,
        isValid: true
      });
    } catch (error: any) {
      setDecodedResult({
        input: base64Input,
        output: '',
        inputSize: base64Input.length,
        outputSize: 0,
        isValid: false,
        error: error.message
      });
    }
  }, [base64Input]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Remove the data URL prefix (data:mime/type;base64,)
      const base64Data = result.split(',')[1] || result;
      setFileBase64(base64Data);
    };
    reader.readAsDataURL(file);
  }, []);

  const downloadAsFile = useCallback((content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadDecodedFile = useCallback(() => {
    if (!fileBase64 || !selectedFile) return;
    
    try {
      const binaryString = atob(fileBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: selectedFile.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decoded_${selectedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }, [fileBase64, selectedFile]);

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

  return (
    <div className="space-y-6">
      {/* Text Encoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="default">Encode</Badge>
            <CardTitle>Text to Base64</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter text to encode to Base64 • Press{' '}
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
            placeholder="Enter text to encode..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button onClick={encodeToBase64} disabled={!textInput.trim()}>
              Encode to Base64
            </Button>
            <Button onClick={() => setTextInput('')} variant="outline">
              Clear
            </Button>
          </div>

          {encodedResult && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={encodedResult.isValid ? "default" : "destructive"}>
                    {encodedResult.isValid ? "Encoded" : "Error"}
                  </Badge>
                  {encodedResult.isValid && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {encodedResult.outputSize} chars
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        +{Math.round(((encodedResult.outputSize - encodedResult.inputSize) / encodedResult.inputSize) * 100)}% size
                      </Badge>
                    </div>
                  )}
                </div>
                
                {encodedResult.isValid ? (
                  <div className="space-y-2">
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                      {encodedResult.output}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(encodedResult.output)}
                      variant="outline"
                      size="sm"
                    >
                      Copy Base64
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

      {/* Text Decoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Decode</Badge>
            <CardTitle>Base64 to Text</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter Base64 string to decode to text
            </p>
            <Badge variant="outline" className="text-xs">
              {base64Input.length} chars
            </Badge>
          </div>
          
          <Textarea
            placeholder="Enter Base64 string to decode..."
            value={base64Input}
            onChange={(e) => setBase64Input(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button onClick={decodeFromBase64} disabled={!base64Input.trim()}>
              Decode from Base64
            </Button>
            <Button onClick={() => setBase64Input('')} variant="outline">
              Clear
            </Button>
          </div>

          {decodedResult && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={decodedResult.isValid ? "default" : "destructive"}>
                    {decodedResult.isValid ? "Decoded" : "Error"}
                  </Badge>
                  {decodedResult.isValid && (
                    <Badge variant="outline" className="text-xs">
                      {decodedResult.outputSize} chars
                    </Badge>
                  )}
                </div>
                
                {decodedResult.isValid ? (
                  <div className="space-y-2">
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto max-h-[200px] whitespace-pre-wrap break-words">
                      {decodedResult.output}
                    </pre>
                    <Button
                      onClick={() => copyToClipboard(decodedResult.output)}
                      variant="outline"
                      size="sm"
                    >
                      Copy Text
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

      {/* File Encoder Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge variant="outline">File</Badge>
            <CardTitle>File to Base64</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a file to encode to Base64 string
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
              <div className="space-y-4">
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

                {fileBase64 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="default">Base64 Output</Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {fileBase64.length} chars
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(fileBase64.length * 0.75)} estimated
                        </Badge>
                      </div>
                    </div>
                    
                    <pre className="text-sm bg-muted/30 p-3 rounded-md overflow-auto max-h-[200px] whitespace-pre-wrap break-all">
                      {fileBase64}
                    </pre>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => copyToClipboard(fileBase64)}
                        variant="outline"
                        size="sm"
                      >
                        Copy Base64
                      </Button>
                      <Button
                        onClick={() => downloadAsFile(fileBase64, `${selectedFile.name}.base64.txt`)}
                        variant="outline"
                        size="sm"
                      >
                        Download as Text
                      </Button>
                      <Button
                        onClick={downloadDecodedFile}
                        variant="outline"
                        size="sm"
                      >
                        Download Original
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Base64Tool;