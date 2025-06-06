# Disk Lens Tool

A powerful disk space analyzer tool that helps you visualize and manage disk usage by identifying large files and directories.

## Features

### 1. Cross-Platform Disk Detection
- **Windows**: Automatically detects all drive letters (C:\, D:\, etc.)
- **macOS**: Shows root directory (/) and mounted volumes in /Volumes
- **Linux**: Shows root directory (/) and mounted drives in /media and /mnt

### 2. Directory Browsing
- Select any disk or browse to a specific directory
- Uses native file picker dialog for directory selection

### 3. Real-Time Scanning
- Live progress updates during scanning
- Shows current path being scanned
- Displays number of files scanned and total size found
- Cancel scan at any time

### 4. Smart File Grouping
- Files and directories sorted by size (largest first)
- Small items (< 5% of total size) automatically grouped into "Other" category
- Prevents clutter from numerous small files

### 5. Visual Size Representation
- Progress bars show relative size of each item
- Percentage of total space displayed for each item
- Size shown in human-readable format (KB, MB, GB, etc.)

### 6. Multi-Select and Bulk Delete
- Checkbox selection for multiple files/directories
- Select items to add to deletion cart
- Delete all selected items at once with confirmation
- Safe deletion with error handling

## Usage

1. **Launch the Tool**: Click on "Disk Lens" from the toolbox home page

2. **Select Location**: 
   - Click on a disk button to scan entire disk
   - Click "Browse Directory" to select a specific folder

3. **Wait for Scan**: 
   - Watch real-time progress as files are scanned
   - Large directories may take several minutes

4. **Review Results**:
   - Items sorted by size, largest first
   - Small items grouped together
   - See size and percentage for each item

5. **Clean Up**:
   - Check boxes next to items you want to delete
   - Click "Delete X item(s)" button
   - Confirm deletion when prompted

## Technical Details

### Frontend
- Built with React and TypeScript
- Uses Tauri API for native file system access
- Real-time updates via Tauri event system
- Responsive UI with Tailwind CSS

### Backend
- Rust-based scanning engine
- Uses `walkdir` crate for efficient directory traversal
- Async operations with Tokio
- Cross-platform file system operations

### Permissions
The tool requires the following Tauri permissions:
- `fs:read-all` - Read file system to scan directories
- `fs:write-all` - Delete selected files
- `fs:allow-remove` - Remove files and directories
- `fs:allow-exists` - Check if paths exist
- `fs:allow-read-dir` - List directory contents
- `dialog:default` - Show file picker dialog
- `core:event:allow-emit` - Emit progress updates

## Safety Features

1. **Confirmation Required**: Always asks for confirmation before deleting
2. **Error Handling**: Gracefully handles permission errors
3. **No System Files**: User must explicitly navigate to system directories
4. **Visual Feedback**: Clear indication of what will be deleted

## Performance Considerations

- Initial scan may be slow for large drives
- Directory size calculation is recursive
- Progress updates throttled to every 100 files
- UI remains responsive during scanning

## Future Enhancements

- [ ] File type filtering (e.g., show only videos, images)
- [ ] Export scan results to CSV/JSON
- [ ] Duplicate file detection
- [ ] Scheduled scans
- [ ] Treemap visualization
- [ ] Storage trend analysis over time