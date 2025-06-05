# Log Viewer

A powerful tool for parsing and visualizing structured log messages with a table-based interface, syntax highlighting, and expandable row details.

## Features

### Core Functionality
- **Full-Width Table Layout**: Utilizes the entire screen width for maximum information display
- **Multi-line Input**: Accepts multiple log entries, one per line
- **JSON Parsing**: Automatically detects and parses JSON-structured log messages
- **Mixed Content Support**: Handles both JSON and plain text log entries

### Table Interface
- **Column-Based Display**: Each unique key becomes a table column
- **Row-Based Logs**: Each log entry is displayed as a table row
- **Smart Column Ordering**: Common fields (timestamp, level, message, service) appear first
- **Type Indicators**: Visual badges showing JSON vs plain text entries
- **Responsive Layout**: Adapts to different screen sizes

### Interactive Features
- **Expandable Rows**: Click the arrow button to expand rows for detailed view
- **Row Selection**: Click on any row to highlight it
- **Detailed View**: Expanded rows show all key-value pairs in a formatted layout
- **Collapsible Interface**: "Collapse All" button to close all expanded rows

### Text Formatting
- **Line Breaks**: Converts `\n` to actual line breaks
- **Indentation**: Converts `\t` to proper indentation
- **Truncation**: Long values are truncated in table view but shown in full when expanded
- **Tooltips**: Hover over truncated cells to see full content

### Syntax Highlighting
- **Timestamps**: Blue, monospace font
- **Log Levels**: Color-coded by severity
  - Error/Fatal: Red
  - Warning: Yellow  
  - Info: Green
  - Debug/Trace: Gray
- **Code References**: Purple, monospace font (file names, line numbers)

### Keyboard Shortcuts
- **Ctrl/Cmd+K**: Clear input
- **Ctrl/Cmd+A**: Select all text in input

## Usage

### Basic Workflow
1. **Input Logs**: Paste structured log messages into the input textarea
2. **Automatic Parsing**: The tool automatically detects JSON structure
3. **Table Display**: Logs appear in a sortable, interactive table
4. **Expand Details**: Click the arrow (▶) to expand individual rows
5. **View Full Content**: Expanded view shows complete, formatted log data

### Table Interface
- **Columns**: Automatically generated from all unique keys across all log entries
- **Rows**: Each log entry becomes a clickable table row
- **Type Column**: Shows whether the entry is JSON or plain text
- **Index Column**: Shows the line number for easy reference

### Interaction
- **Click Row**: Highlight and select a log entry
- **Click Arrow**: Expand/collapse detailed view
- **Hover**: See tooltips for truncated content

## Supported Log Formats

### JSON Logs (Recommended)
```json
{"timestamp":"2024-01-15T10:30:45.123Z","level":"info","message":"Application started","service":"web-server","user_id":12345}
{"timestamp":"2024-01-15T10:30:46.234Z","level":"error","message":"Database error","error":"Connection timeout","file":"db.go","line":42}
```

### Plain Text Logs
```
2024-01-15 10:30:45 INFO Application started
2024-01-15 10:30:46 ERROR Database connection failed
```

### Mixed Format
```
{"timestamp":"2024-01-15T10:30:45.123Z","level":"info","message":"Structured log"}
2024-01-15 10:30:46 WARN Plain text log entry
{"timestamp":"2024-01-15T10:30:47.234Z","level":"error","message":"Another structured log"}
```

## Column Recognition

The table automatically creates columns for all unique keys found in your logs:

### Priority Columns (Shown First)
- `timestamp`, `time`, `ts`, `date`, `datetime`, `@timestamp`
- `level`, `severity`, `priority`, `loglevel`
- `message`, `msg`
- `service`, `component`

### Auto-Generated Columns
- All other unique keys found across all log entries
- Columns appear in alphabetical order after priority columns

## Field Highlighting

### Timestamps
- **Keys**: `timestamp`, `time`, `ts`, `date`, `datetime`, `@timestamp`
- **Values**: Any field containing ISO date format (YYYY-MM-DD)
- **Style**: Blue text, monospace font

### Log Levels  
- **Keys**: `level`, `severity`, `priority`, `loglevel`
- **Values**: `error`, `warn`, `warning`, `info`, `debug`, `trace`, `fatal`
- **Colors**:
  - Error/Fatal: Red background and text
  - Warning: Yellow background and text  
  - Info: Green background and text
  - Debug/Trace: Gray background and text

### Code References
- **Keys**: `line`, `lineno`, `linenumber`, `file`, `filename`, `source`, `location`
- **Style**: Purple text, monospace font

## Example Usage

### Input
```
{"timestamp":"2024-01-15T10:30:45.123Z","level":"info","message":"User login successful","service":"auth","user_id":12345,"session_id":"sess_abc123"}
{"timestamp":"2024-01-15T10:30:46.234Z","level":"error","message":"Database query failed","service":"db","error":"Timeout after 30s","file":"queries.go","line":142,"query_time_ms":30000}
{"timestamp":"2024-01-15T10:30:47.345Z","level":"warn","message":"High memory usage detected","service":"monitor","memory_mb":1024,"threshold_mb":800}
```

### Table Output
- **Columns**: timestamp, level, message, service, user_id, session_id, error, file, line, query_time_ms, memory_mb, threshold_mb
- **Rows**: 3 log entries with appropriate highlighting
- **Expandable**: Click arrows to see detailed, formatted view of each entry

## Performance

- **Large Datasets**: Efficiently handles thousands of log entries
- **Real-time Parsing**: Instant feedback as you type or paste logs
- **Memory Efficient**: Only renders visible content
- **Responsive**: Smooth interactions even with complex log structures

## Tips

### Best Practices
- **Use JSON Format**: Provides the richest table experience
- **Consistent Structure**: Similar log entries create better columns
- **One Line Per Entry**: Each log should be on a separate line
- **Complete Entries**: Ensure JSON objects are properly closed

### Troubleshooting
- **Missing Columns**: Check that field names are consistent across entries  
- **Parsing Issues**: Verify JSON syntax is valid
- **Performance**: For very large datasets, consider filtering before pasting
- **Layout Issues**: Use horizontal scroll if you have many columns

### Keyboard Shortcuts
- **Ctrl/Cmd+K**: Quick way to clear input and start fresh
- **Ctrl/Cmd+A**: Select all text for easy replacement

## Technical Details

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Table Component**: Custom responsive table with virtual scrolling
- **Parsing**: Real-time JSON parsing with error handling
- **State Management**: Efficient React state for large datasets