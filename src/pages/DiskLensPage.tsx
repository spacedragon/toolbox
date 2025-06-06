import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Folder, File, Trash2, HardDrive, FolderOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { formatBytes } from '@/lib/utils';

interface FileSystemItem {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  children?: FileSystemItem[];
}

interface ScanProgress {
  currentPath: string;
  filesScanned: number;
  totalSize: number;
  isComplete: boolean;
}

const DiskLensPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [scanResults, setScanResults] = useState<FileSystemItem[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [totalSize, setTotalSize] = useState(0);
  const [diskList, setDiskList] = useState<string[]>([]);
  const [scannedItems, setScannedItems] = useState<FileSystemItem[]>([]);

  // Get available disks on mount
  useEffect(() => {
    const fetchDisks = async () => {
      try {
        const disks = await invoke<string[]>('get_available_disks');
        setDiskList(disks);
      } catch (error) {
        console.error('Failed to fetch disks:', error);
      }
    };
    fetchDisks();
  }, []);

  // Listen for scan progress and scan-item updates
  useEffect(() => {
    let unlistenProgress: any;
    let unlistenItem: any;

    const setupListeners = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      // Progress event
      unlistenProgress = await listen<ScanProgress>('scan-progress', (event) => {
        setScanProgress(event.payload);
        if (event.payload.isComplete) {
          setIsScanning(false);
        }
      });
      // Item event
      unlistenItem = await listen<FileSystemItem>('scan-item', (event) => {
        setScannedItems(prev => [...prev, event.payload]);
      });
    };

    setupListeners();

    return () => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenItem) unlistenItem();
    };
  }, []);

  const startScan = async (path: string) => {
    setSelectedPath(path);
    setIsScanning(true);
    setScanResults([]);
    setScannedItems([]);
    setSelectedItems(new Set());
    setTotalSize(0);

    try {
      // Start scan, but don't wait for results (they come via events)
      await invoke('scan_directory', { path });
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
    }
  };

  const processResults = (items: FileSystemItem[]): FileSystemItem[] => {
    // Sort by size (largest first)
    const sorted = [...items].sort((a, b) => b.size - a.size);

    // Calculate 5% threshold
    const totalSize = sorted.reduce((acc, item) => acc + item.size, 0);
    const threshold = totalSize * 0.05;

    const processed: FileSystemItem[] = [];
    const smallItems: FileSystemItem[] = [];

    sorted.forEach(item => {
      if (item.size >= threshold) {
        processed.push(item);
      } else {
        smallItems.push(item);
      }
    });

    // Group small items if any exist
    if (smallItems.length > 0) {
      const smallItemsSize = smallItems.reduce((acc, item) => acc + item.size, 0);
      processed.push({
        path: 'small-items-group',
        name: `Other (${smallItems.length} items)`,
        size: smallItemsSize,
        isDirectory: true,
        children: smallItems
      });
    }

    return processed;
  };

  const toggleItemSelection = (path: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedItems(newSelected);
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      const paths = Array.from(selectedItems);
      await invoke('delete_items', { paths });
      
      // Refresh scan results
      await startScan(selectedPath);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('Failed to delete some items. Please check permissions.');
    }
  };

  const getItemIcon = (item: FileSystemItem) => {
    if (item.isDirectory) {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getSizePercentage = (size: number) => {
    if (totalSize === 0) return 0;
    return (size / totalSize) * 100;
  };

  const renderFileItem = (item: FileSystemItem, depth: number = 0) => {
    const percentage = getSizePercentage(item.size);
    const isSelected = selectedItems.has(item.path);
    
    return (
      <div key={item.path} className="border-b last:border-b-0">
        <div 
          className={`flex items-center p-3 hover:bg-muted/50 transition-colors ${
            isSelected ? 'bg-primary/10' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleItemSelection(item.path)}
            className="mr-3"
          />
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getItemIcon(item)}
            <span className="truncate text-sm font-medium">{item.name}</span>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <div className="w-32">
              <Progress value={percentage} className="h-2" />
            </div>
            <Badge variant="secondary" className="min-w-[80px] justify-center">
              {formatBytes(item.size)}
            </Badge>
            <span className="text-xs text-muted-foreground min-w-[50px] text-right">
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {item.children && item.children.map(child => renderFileItem(child, depth + 1))}
      </div>
    );
  };

  // Update scanResults and totalSize as scannedItems changes
  useEffect(() => {
    if (scannedItems.length > 0) {
      const processed = processResults(scannedItems);
      setScanResults(processed);
      const total = scannedItems.reduce((acc, item) => acc + item.size, 0);
      setTotalSize(total);
    } else {
      setScanResults([]);
      setTotalSize(0);
    }
  }, [scannedItems]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Disk Lens</h1>
              <p className="text-muted-foreground">Analyze disk space and find large files</p>
            </div>
          </div>
          
          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              onClick={deleteSelectedItems}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedItems.size} item(s)
            </Button>
          )}
        </div>

        {/* Disk/Directory Selection */}
        {!isScanning && scanResults.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select a disk or directory to scan</CardTitle>
              <CardDescription>
                Choose a location to analyze disk space usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diskList.map(disk => (
                  <Button
                    key={disk}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => startScan(disk)}
                  >
                    <HardDrive className="h-8 w-8" />
                    <span>{disk}</span>
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={async () => {
                    try {
                      const { open } = await import('@tauri-apps/plugin-dialog');
                      const selected = await open({
                        directory: true,
                        multiple: false,
                      });
                      if (selected) {
                        startScan(selected as string);
                      }
                    } catch (error) {
                      console.error('Failed to open directory picker:', error);
                    }
                  }}
                >
                  <FolderOpen className="h-8 w-8" />
                  <span>Browse Directory</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanning Progress */}
        {isScanning && (
          <Card>
            <CardHeader>
              <CardTitle>Scanning in progress...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current: {scanProgress?.currentPath || 'Starting...'}
                </p>
                <Progress value={30} className="animate-pulse" />
              </div>
              
              {scanProgress && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Files scanned:</span>
                    <p className="font-medium">{scanProgress.filesScanned.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total size:</span>
                    <p className="font-medium">{formatBytes(scanProgress.totalSize)}</p>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  invoke('cancel_scan');
                  setIsScanning(false);
                }}
              >
                Cancel Scan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!isScanning && scanResults.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scan Results</CardTitle>
                  <CardDescription>
                    {selectedPath} - Total size: {formatBytes(totalSize)}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScanResults([]);
                    setSelectedItems(new Set());
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {scanResults.map(item => renderFileItem(item))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiskLensPage;