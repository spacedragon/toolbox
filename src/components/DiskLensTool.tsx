import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox'; // Import Checkbox

interface ScannedItem {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  error?: string;
}

interface ScanEventPayload {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  error?: string;
}

interface ScanCompletePayload {
  path: string;
  success: boolean;
  error?: string;
}

export const sortItems = (items: ScannedItem[], order: 'asc' | 'desc'): ScannedItem[] => {
  return [...items].sort((a, b) => {
    if (order === 'asc') {
      return a.size - b.size;
    }
    return b.size - a.size;
  });
};

export const formatSize = (bytes: number): string => {
  if (bytes < 0) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DiskLensTool: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transientError, setTransientError] = useState<string | null>(null); // For errors shown temporarily
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [itemsToDelete, setItemsToDelete] = useState<Set<string>>(new Set());

  const displayTransientError = (message: string) => {
    setTransientError(message);
    setTimeout(() => setTransientError(null), 3000);
  };

  const handleSelectFolder = async () => {
    setError(null);
    setTransientError(null);
    setItemsToDelete(new Set());
    try {
      const result = await invoke<string | null>('select_folder');
      if (result) {
        if (result !== selectedFolder) {
            setScannedItems([]);
            setSelectedFolder(result);
        } else if (scannedItems.length === 0 && selectedFolder !== null ) {
            setScannedItems([]);
            const currentPath = selectedFolder;
            setSelectedFolder(null);
            setTimeout(() => setSelectedFolder(currentPath), 0);
        }
      }
    } catch (errCatch) {
      const err = errCatch as Error;
      console.error('Failed to select folder:', err);
      setError(`Failed to select folder: ${typeof err === 'string' ? err : err.message}`);
      setSelectedFolder(null);
      setScannedItems([]);
      setItemsToDelete(new Set());
    }
  };

  useEffect(() => {
    if (!selectedFolder) {
      if (selectedFolder === null) {
         setScannedItems([]);
         setItemsToDelete(new Set());
      }
      setIsBusy(false);
      return;
    }

    setItemsToDelete(new Set());

    let unlistenScanEvent: UnlistenFn | undefined;
    let unlistenScanComplete: UnlistenFn | undefined;

    const startScan = async () => {
      setIsBusy(true);
      setError(null);
      setTransientError(null);

      try {
        unlistenScanEvent = await listen<ScanEventPayload>('scan_event', (event) => {
          setScannedItems(prevItems => {
            const existingIndex = prevItems.findIndex(item => item.path === event.payload.path);
            if (existingIndex !== -1) {
              const updatedItems = [...prevItems];
              updatedItems[existingIndex] = event.payload;
              return updatedItems;
            }
            return [...prevItems, event.payload];
          });
        });

        unlistenScanComplete = await listen<ScanCompletePayload>('scan_complete', (event) => {
          if (event.payload.path === selectedFolder) {
            setIsBusy(false);
            if (!event.payload.success && !error && !transientError) {
              setError(event.payload.error || 'Scan completed with errors.');
            }
          }
        });

        await invoke('scan_folder', { path: selectedFolder });

      } catch (errCatch) {
        const err = errCatch as Error;
        console.error('Failed to start scan:', err);
        setError(`Failed to start scan: ${typeof err === 'string' ? err : err.message}`);
        setIsBusy(false);
      }
    };

    startScan();

    return () => {
      if (unlistenScanEvent) unlistenScanEvent();
      if (unlistenScanComplete) unlistenScanComplete();
      setIsBusy(false);
    };
  }, [selectedFolder, error, transientError]); // Added error and transientError to dependencies


  const handleSort = (newOrder: 'asc' | 'desc') => {
    setSortOrder(newOrder);
  };

  const sortedScannedItems = useMemo(() => {
    return sortItems(scannedItems, sortOrder);
  }, [scannedItems, sortOrder]);

  const handleDeleteSelected = async () => {
    if (itemsToDelete.size === 0) {
      displayTransientError("No items selected for deletion.");
      return;
    }

    const itemsArray = Array.from(itemsToDelete);
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${itemsToDelete.size} item(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setTransientError(null);
    try {
      const successfullyDeletedPaths = await invoke<string[]>('delete_items', { paths: itemsArray });

      setScannedItems(prevItems => prevItems.filter(item => !successfullyDeletedPaths.includes(item.path)));
      setItemsToDelete(new Set());

    } catch (errCatch) {
      const err = errCatch as Error;
      console.error('Failed to delete items:', err);
      setError(`Failed to delete items: ${typeof err === 'string' ? err : err.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const numSelectableItems = useMemo(() => sortedScannedItems.filter(item => !item.error).length, [sortedScannedItems]);

  const allSelectedState: boolean | 'indeterminate' = useMemo(() => {
    if (numSelectableItems === 0) return false;
    if (itemsToDelete.size === numSelectableItems && itemsToDelete.size > 0) return true;
    if (itemsToDelete.size > 0 && itemsToDelete.size < numSelectableItems) return 'indeterminate';
    return false;
  }, [itemsToDelete.size, numSelectableItems]);

  const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    const newItemsToDelete = new Set<string>();
    if (checked === true) {
      sortedScannedItems.forEach(item => {
        if (!item.error) {
          newItemsToDelete.add(item.path);
        }
      });
    }
    setItemsToDelete(newItemsToDelete);
  };

  const currentDisplayError = error || transientError; // Consolidate error display

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <Card>
        <CardHeader>
          <CardTitle>Disk Lens Analyzer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSelectFolder} disabled={isBusy}>
            {isBusy && selectedFolder ? 'Busy...' : isBusy && !selectedFolder ? 'Loading...' : (selectedFolder ? 'Change Folder / Rescan' : 'Select Folder to Analyze')}
          </Button>
          {selectedFolder && <p className="text-sm">Selected: <code className="bg-gray-100 dark:bg-gray-700 p-1 rounded text-sm break-all">{selectedFolder}</code></p>}
          {currentDisplayError && <p className="text-red-500 text-sm">{currentDisplayError}</p>}
        </CardContent>
      </Card>

      {(scannedItems.length > 0 || (isBusy && selectedFolder) ) && (
        <Card className="flex-grow flex flex-col min-h-0">
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardTitle className="whitespace-nowrap">Scanned Items ({sortedScannedItems.length})</CardTitle>
              <div className="flex space-x-2 items-center flex-wrap">
                <span className="text-sm whitespace-nowrap">Sort:</span>
                <Button variant="outline" size="sm" onClick={() => handleSort('asc')} disabled={sortOrder === 'asc' || isBusy} aria-pressed={sortOrder === 'asc'}>Size Asc</Button>
                <Button variant="outline" size="sm" onClick={() => handleSort('desc')} disabled={sortOrder === 'desc' || isBusy} aria-pressed={sortOrder === 'desc'}>Size Desc</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={itemsToDelete.size === 0 || isBusy}
                >
                  Delete Selected ({itemsToDelete.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {isBusy && sortedScannedItems.length === 0 && selectedFolder && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Scanning {selectedFolder}. Items will appear as they are found...</p>
            )}
            {!isBusy && sortedScannedItems.length === 0 && selectedFolder && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No items found in {selectedFolder}, the folder is empty, or access was denied for all items.</p>
            )}
            {sortedScannedItems.length > 0 && (
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[5%] px-2">
                      <Checkbox
                        aria-label="Select all items"
                        checked={allSelectedState}
                        disabled={isBusy || numSelectableItems === 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[20%] text-right">Size</TableHead>
                    <TableHead className="w-[10%] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScannedItems.map((item) => (
                    <TableRow
                      key={item.path}
                      className={`${itemsToDelete.has(item.path) ? 'bg-muted/50 dark:bg-muted/40' : ''} hover:bg-muted/30 dark:hover:bg-muted/20`}
                      aria-selected={itemsToDelete.has(item.path)}
                    >
                      <TableCell className="px-2">
                        <Checkbox
                          aria-label={`Select ${item.name}`}
                          checked={itemsToDelete.has(item.path)}
                          disabled={!!item.error || isBusy}
                          onCheckedChange={(checked) => {
                            const newItemsToDelete = new Set(itemsToDelete);
                            if (checked === true) {
                              newItemsToDelete.add(item.path);
                            } else {
                              newItemsToDelete.delete(item.path);
                            }
                            setItemsToDelete(newItemsToDelete);
                          }}
                        />
                      </TableCell>
                      <TableCell className="truncate" title={item.path}>
                        {item.name}
                        {item.error && <span className="block text-xs text-red-500 ml-0 mt-1">(Error: {item.error})</span>}
                      </TableCell>
                      <TableCell>{item.is_dir ? 'Folder' : 'File'}</TableCell>
                      <TableCell className="text-right">{formatSize(item.size)}</TableCell>
                      <TableCell className="text-center">
                        {/* Individual actions */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiskLensTool;
