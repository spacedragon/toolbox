import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Base64Result {
  input: string;
  output: string;
  inputSize: number;
  outputSize: number;
  isValid: boolean;
  error?: string;
}

type DataType = 'text' | 'bool' | 'int8' | 'int16' | 'int32' | 'int64' | 'bigint' | 'hex';
type Endianness = 'little' | 'big';

interface EncodingOptions {
  dataType: DataType;
  endianness: Endianness;
}

const Base64Tool: React.FC = () => {
  const [textInput, setTextInput] = useState('Hello, World! This is a sample text for Base64 encoding.');
  const [base64Input, setBase64Input] = useState('');
  
  // Debounce timers
  const encodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const decodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [encodedResult, setEncodedResult] = useState<Base64Result | null>(null);
  const [decodedResult, setDecodedResult] = useState<Base64Result | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for enhanced features
  const [encodingOptions, setEncodingOptions] = useState<EncodingOptions>({
    dataType: 'text',
    endianness: 'little'
  });
  const [outputFormat, setOutputFormat] = useState<'base64' | 'hex'>('base64');
  const [inputFormat, setInputFormat] = useState<'text' | 'base64' | 'hex'>('text');
  const [decodingInputFormat, setDecodingInputFormat] = useState<'base64' | 'hex'>('base64');
  const [decodingOutputFormat, setDecodingOutputFormat] = useState<'text' | 'hex'>('text');

  // No need to track previous values since we trigger updates on changes
  
  // Run encoding/decoding on initial load
  useEffect(() => {
    if (textInput.trim()) {
      encodeToBase64();
    }
  }, [/* eslint-disable-next-line react-hooks/exhaustive-deps */]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        setTextInput('');
        setBase64Input('');
        setEncodedResult(null);
        setDecodedResult(null);
        
        // Clear any pending debounce timers
        if (encodeTimeoutRef.current) clearTimeout(encodeTimeoutRef.current);
        if (decodeTimeoutRef.current) clearTimeout(decodeTimeoutRef.current);
      }
    }
  }, []);

  // Convert data to ArrayBuffer based on data type
  const dataToArrayBuffer = useCallback((data: string, dataType: DataType): ArrayBuffer | null => {
    try {
      if (dataType === 'text') {
        // Convert text to UTF-8 encoded ArrayBuffer
        return new TextEncoder().encode(data).buffer;
      } else if (dataType === 'hex') {
        // Convert hex string to ArrayBuffer
        if (!/^[0-9A-Fa-f]*$/.test(data)) {
          throw new Error('Invalid hex string');
        }
        // Ensure even length
        const hexString = data.length % 2 ? '0' + data : data;
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        return bytes.buffer;
      } else if (dataType === 'bool') {
        // Convert boolean string to single byte (0 or 1)
        const boolValue = data.toLowerCase() === 'true' || data === '1';
        const bytes = new Uint8Array(1);
        bytes[0] = boolValue ? 1 : 0;
        return bytes.buffer;
      } else {
        // Convert number types
        const value = BigInt(data.trim());
        let bytes;
        
        switch(dataType) {
          case 'int8':
            if (value < -128n || value > 127n) throw new Error('Value out of range for Int8');
            bytes = new Int8Array(1);
            bytes[0] = Number(value);
            break;
          case 'int16':
            if (value < -32768n || value > 32767n) throw new Error('Value out of range for Int16');
            bytes = new Int16Array(1);
            bytes[0] = Number(value);
            break;
          case 'int32':
            if (value < -2147483648n || value > 2147483647n) throw new Error('Value out of range for Int32');
            bytes = new Int32Array(1);
            bytes[0] = Number(value);
            break;
          case 'int64':
            if (value < -9223372036854775808n || value > 9223372036854775807n) 
              throw new Error('Value out of range for Int64');
            bytes = new BigInt64Array(1);
            bytes[0] = value;
            break;
          case 'bigint':
            // Convert BigInt to bytes (custom implementation)
            const isNegative = value < 0n;
            const absValue = isNegative ? -value : value;
            const hex = absValue.toString(16);
            const paddedHex = hex.length % 2 ? '0' + hex : hex;
            const byteLength = paddedHex.length / 2;
            
            // Add one byte for sign if needed
            bytes = new Uint8Array(byteLength + (isNegative ? 1 : 0));
            
            // Fill in the bytes
            for (let i = 0; i < byteLength; i++) {
              const byteValue = parseInt(paddedHex.substring(i * 2, i * 2 + 2), 16);
              bytes[isNegative ? i + 1 : i] = byteValue;
            }
            
            // Set sign byte if negative
            if (isNegative) {
              bytes[0] = 0xFF;
            }
            break;
          default:
            throw new Error(`Unsupported data type: ${dataType}`);
        }
        
        return bytes.buffer;
      }
    } catch (error: any) {
      throw new Error(`Failed to convert data: ${error.message}`);
    }
  }, []);
  
  // Apply endianness to ArrayBuffer
  const applyEndianness = useCallback((buffer: ArrayBuffer, dataType: DataType, endianness: Endianness): ArrayBuffer => {
    // No need to swap for text, bool, int8, or hex
    if (dataType === 'text' || dataType === 'bool' || dataType === 'int8' || dataType === 'hex') {
      return buffer;
    }
    
    // Check if we need to swap (system endianness is different from requested)
    const systemIsLittleEndian = (() => {
      const test = new Uint16Array([0x1234]);
      const view = new Uint8Array(test.buffer);
      return view[0] === 0x34;
    })();
    
    const needToSwap = (systemIsLittleEndian && endianness === 'big') || 
                       (!systemIsLittleEndian && endianness === 'little');
    
    if (!needToSwap) return buffer;
    
    // Swap bytes
    const bytes = new Uint8Array(buffer);
    const swapped = new Uint8Array(bytes.length);
    
    let bytesPerElement = 1;
    switch(dataType) {
      case 'int16': bytesPerElement = 2; break;
      case 'int32': bytesPerElement = 4; break;
      case 'int64': bytesPerElement = 8; break;
      case 'bigint': bytesPerElement = bytes.length; break; // Custom handling for bigint
    }
    
    // Swap bytes for each element
    for (let i = 0; i < bytes.length; i += bytesPerElement) {
      for (let j = 0; j < bytesPerElement; j++) {
        swapped[i + j] = bytes[i + (bytesPerElement - 1 - j)];
      }
    }
    
    return swapped.buffer;
  }, []);
  
  // Convert ArrayBuffer to output format (base64 or hex)
  const arrayBufferToOutput = useCallback((buffer: ArrayBuffer, format: 'base64' | 'hex'): string => {
    const bytes = new Uint8Array(buffer);
    
    if (format === 'hex') {
      // Convert to hex
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Convert to base64
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }, []);
  
  const encodeToBase64 = useCallback(() => {
    if (!textInput.trim()) return;
    try {
      let output: string;
      let inputSize = textInput.length;
      
      if (encodingOptions.dataType === 'text' && inputFormat === 'text' && outputFormat === 'base64') {
        // Use the built-in base64 encoding for simple text to base64
        output = btoa(unescape(encodeURIComponent(textInput)));
      } else {
        // For all other combinations, use our custom encoding logic
        let inputData = textInput;
        let buffer: ArrayBuffer | null = null;
        
        // Convert input format if needed
        if (inputFormat === 'hex') {
          // Convert hex to binary before processing
          if (!/^[0-9A-Fa-f]*$/.test(inputData)) {
            throw new Error('Invalid hex string');
          }
          
          // Use the hex data as is, but with the selected data type
          buffer = dataToArrayBuffer(inputData, 'hex');
          inputSize = Math.ceil(inputData.length / 2);
        } else {
          // Process based on the selected data type
          buffer = dataToArrayBuffer(inputData, encodingOptions.dataType);
        }
        
        if (!buffer) throw new Error('Failed to convert input data');
        
        // Apply endianness
        const processedBuffer = applyEndianness(buffer, encodingOptions.dataType, encodingOptions.endianness);
        
        // Convert to output format
        output = arrayBufferToOutput(processedBuffer, outputFormat);
      }
      
      setEncodedResult({
        input: textInput,
        output: output,
        inputSize: inputSize,
        outputSize: output.length,
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
  }, [textInput, encodingOptions, inputFormat, outputFormat, dataToArrayBuffer, applyEndianness, arrayBufferToOutput]);

  // Convert array buffer to the specified data type
  const arrayBufferToDataType = useCallback((buffer: ArrayBuffer, dataType: DataType, endianness: Endianness): string => {
    try {
      // Apply endianness first (swap bytes if needed)
      const processedBuffer = applyEndianness(buffer, dataType, endianness);
      
      if (dataType === 'text') {
        // Convert to text
        return new TextDecoder().decode(new Uint8Array(processedBuffer));
      } else if (dataType === 'hex') {
        // Convert to hex string
        return Array.from(new Uint8Array(processedBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } else if (dataType === 'bool') {
        // Convert to boolean
        return new Uint8Array(processedBuffer)[0] ? 'true' : 'false';
      } else {
        // Convert number types
        let result: string;
        
        switch(dataType) {
          case 'int8':
            result = new Int8Array(processedBuffer)[0].toString();
            break;
          case 'int16':
            result = new Int16Array(processedBuffer)[0].toString();
            break;
          case 'int32':
            result = new Int32Array(processedBuffer)[0].toString();
            break;
          case 'int64':
            result = new BigInt64Array(processedBuffer)[0].toString();
            break;
          case 'bigint':
            // Custom handling for bigint
            const bytes = new Uint8Array(processedBuffer);
            let isNegative = false;
            let startIndex = 0;
            
            // Check if first byte is the sign byte
            if (bytes.length > 0 && bytes[0] === 0xFF) {
              isNegative = true;
              startIndex = 1;
            }
            
            // Convert bytes to BigInt
            let value = 0n;
            for (let i = startIndex; i < bytes.length; i++) {
              value = (value << 8n) | BigInt(bytes[i]);
            }
            
            result = (isNegative ? -value : value).toString();
            break;
          default:
            throw new Error(`Unsupported data type: ${dataType}`);
        }
        
        return result;
      }
    } catch (error: any) {
      throw new Error(`Failed to convert data: ${error.message}`);
    }
  }, [applyEndianness]);
  
  // Convert input from base64/hex to binary
  const inputToBinary = useCallback((input: string, format: 'base64' | 'hex'): ArrayBuffer => {
    try {
      if (format === 'base64') {
        // Remove whitespace and newlines
        const cleanBase64 = input.replace(/\s+/g, '');
        
        // Validate Base64 format
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(cleanBase64)) {
          throw new Error('Invalid Base64 format');
        }
        
        // Convert Base64 to binary
        const binary = atob(cleanBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      } else if (format === 'hex') {
        // Validate hex format
        if (!/^[0-9A-Fa-f]*$/.test(input)) {
          throw new Error('Invalid hex format');
        }
        
        // Ensure even length
        const hexString = input.length % 2 ? '0' + input : input;
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        return bytes.buffer;
      } else {
        throw new Error(`Unsupported input format: ${format}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to convert input: ${error.message}`);
    }
  }, []);

  const decodeFromBase64 = useCallback(() => {
    if (!base64Input.trim()) return;
    try {
      let output: string;
      let inputData = base64Input;
      
      if (encodingOptions.dataType === 'text' && decodingInputFormat === 'base64' && decodingOutputFormat === 'text') {
        // Use the built-in base64 decoding for simple base64 to text
        const cleanBase64 = inputData.replace(/\s+/g, '');
        output = decodeURIComponent(escape(atob(cleanBase64)));
      } else {
        // For all other combinations, use our custom decoding logic
        const format = decodingInputFormat === 'hex' ? 'hex' : 'base64';
        const buffer = inputToBinary(inputData, format);
        
        // Convert to the specified data type
        output = arrayBufferToDataType(buffer, encodingOptions.dataType, encodingOptions.endianness);
      }
      
      setDecodedResult({
        input: base64Input,
        output: output,
        inputSize: base64Input.length,
        outputSize: output.length,
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
  }, [base64Input, encodingOptions, decodingInputFormat, decodingOutputFormat, inputToBinary, arrayBufferToDataType]);

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
            <CardTitle>Data to Base64/Hex</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter data to encode • Press{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                Ctrl+K
              </kbd>{' '}
              to clear all
            </p>
            <Badge variant="outline" className="text-xs">
              {textInput.length} chars
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <Label className="text-sm mb-1 block">Input Format</Label>
              <Select 
                value={inputFormat} 
                onValueChange={(value: string) => {
                  setInputFormat(value as 'text' | 'base64' | 'hex');
                  // Trigger encoding when input format changes
                  setTimeout(() => encodeToBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Input Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Data Type</Label>
              <Select 
                value={encodingOptions.dataType} 
                onValueChange={(value: string) => {
                  setEncodingOptions(prev => ({...prev, dataType: value as DataType}));
                  // Trigger encoding when data type changes
                  setTimeout(() => encodeToBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Data Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="bool">Boolean</SelectItem>
                  <SelectItem value="int8">Int8</SelectItem>
                  <SelectItem value="int16">Int16</SelectItem>
                  <SelectItem value="int32">Int32</SelectItem>
                  <SelectItem value="int64">Int64</SelectItem>
                  <SelectItem value="bigint">BigInt</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Output Format</Label>
              <Select 
                value={outputFormat} 
                onValueChange={(value: string) => {
                  setOutputFormat(value as 'base64' | 'hex');
                  // Trigger encoding when output format changes
                  setTimeout(() => encodeToBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Output Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base64">Base64</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show endianness selection only for numeric types */}
          {(['int16', 'int32', 'int64', 'bigint'].includes(encodingOptions.dataType)) && (
            <div className="bg-muted/20 p-2 rounded-md flex items-center space-x-3 mb-2">
              <Label className="text-sm font-medium">Byte Order:</Label>
              <div className="flex space-x-3">
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="little-endian"
                    checked={encodingOptions.endianness === 'little'}
                    onCheckedChange={() => {
                      setEncodingOptions(prev => ({...prev, endianness: 'little'}));
                      // Trigger encoding when endianness changes
                      setTimeout(() => encodeToBase64(), 0);
                    }}
                  />
                  <label htmlFor="little-endian" className="text-sm">Little-endian</label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="big-endian"
                    checked={encodingOptions.endianness === 'big'}
                    onCheckedChange={() => {
                      setEncodingOptions(prev => ({...prev, endianness: 'big'}));
                      // Trigger encoding when endianness changes
                      setTimeout(() => encodeToBase64(), 0);
                    }}
                  />
                  <label htmlFor="big-endian" className="text-sm">Big-endian</label>
                </div>
              </div>
            </div>
          )}
          
          <Textarea
            placeholder={`Enter ${inputFormat === 'text' ? 'text' : 'hex data'} to encode...`}
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              
              // Debounce the encoding to avoid excessive processing
              if (encodeTimeoutRef.current) clearTimeout(encodeTimeoutRef.current);
              encodeTimeoutRef.current = setTimeout(() => {
                encodeToBase64();
              }, 300);
            }}
            onBlur={encodeToBase64}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                setTextInput('');
                setEncodedResult(null);
              }} 
              variant="outline"
            >
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
            <CardTitle>Base64/Hex to Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Enter Base64 or Hex string to decode
            </p>
            <Badge variant="outline" className="text-xs">
              {base64Input.length} chars
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <Label className="text-sm mb-1 block">Input Format</Label>
              <Select 
                value={decodingInputFormat} 
                onValueChange={(value: string) => {
                  setDecodingInputFormat(value as 'base64' | 'hex');
                  // Trigger decoding when input format changes
                  setTimeout(() => decodeFromBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Input Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="base64">Base64</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Data Type</Label>
              <Select 
                value={encodingOptions.dataType} 
                onValueChange={(value: string) => {
                  setEncodingOptions(prev => ({...prev, dataType: value as DataType}));
                  // Trigger decoding when data type changes
                  setTimeout(() => decodeFromBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Data Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="bool">Boolean</SelectItem>
                  <SelectItem value="int8">Int8</SelectItem>
                  <SelectItem value="int16">Int16</SelectItem>
                  <SelectItem value="int32">Int32</SelectItem>
                  <SelectItem value="int64">Int64</SelectItem>
                  <SelectItem value="bigint">BigInt</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-1 block">Output Format</Label>
              <Select 
                value={decodingOutputFormat} 
                onValueChange={(value: string) => {
                  setDecodingOutputFormat(value as 'text' | 'hex');
                  // Trigger decoding when output format changes
                  setTimeout(() => decodeFromBase64(), 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Output Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Show endianness selection only for numeric types */}
          {(['int16', 'int32', 'int64', 'bigint'].includes(encodingOptions.dataType)) && (
            <div className="bg-muted/20 p-2 rounded-md flex items-center space-x-3 mb-2">
              <Label className="text-sm font-medium">Byte Order:</Label>
              <div className="flex space-x-3">
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="decode-little-endian"
                    checked={encodingOptions.endianness === 'little'}
                    onCheckedChange={() => {
                      setEncodingOptions(prev => ({...prev, endianness: 'little'}));
                      // Trigger decoding when endianness changes
                      setTimeout(() => decodeFromBase64(), 0);
                    }}
                  />
                  <label htmlFor="decode-little-endian" className="text-sm">Little-endian</label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="decode-big-endian"
                    checked={encodingOptions.endianness === 'big'}
                    onCheckedChange={() => {
                      setEncodingOptions(prev => ({...prev, endianness: 'big'}));
                      // Trigger decoding when endianness changes
                      setTimeout(() => decodeFromBase64(), 0);
                    }}
                  />
                  <label htmlFor="decode-big-endian" className="text-sm">Big-endian</label>
                </div>
              </div>
            </div>
          )}
          
          <Textarea
            placeholder={`Enter ${decodingInputFormat === 'base64' ? 'Base64' : 'Hex'} string to decode...`}
            value={base64Input}
            onChange={(e) => {
              setBase64Input(e.target.value);
              
              // Debounce the decoding to avoid excessive processing
              if (decodeTimeoutRef.current) clearTimeout(decodeTimeoutRef.current);
              decodeTimeoutRef.current = setTimeout(() => {
                decodeFromBase64();
              }, 300);
            }}
            onBlur={decodeFromBase64}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] font-mono text-sm resize-none"
          />
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => {
                setBase64Input('');
                setDecodedResult(null);
              }} 
              variant="outline"
            >
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