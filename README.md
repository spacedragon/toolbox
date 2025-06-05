# Developer Toolbox

A comprehensive collection of essential development tools built with Tauri, React, and TypeScript.

## 🛠️ Tools Available

### 1. Log Viewer ✅
A powerful tool for parsing and visualizing structured log messages with a table-based interface and expandable rows.

**Features:**
- Full-width table layout for maximum information display
- Shared column detection with extra keys in dedicated column
- Click-to-expand rows for detailed view
- Intelligent syntax highlighting for timestamps, log levels, and code references
- Mixed content support (JSON + plain text)
- Real-time parsing and validation

### 2. JSON Formatter ✅
Format, validate, and prettify JSON data with comprehensive analysis.

**Features:**
- Real-time JSON validation with detailed error reporting
- Pretty printing with customizable indentation (2, 4, 8 spaces)
- JSON minification with compression analysis
- Key sorting option for consistent formatting
- Size comparison and compression ratio display
- Copy formatted or minified output

### 3. Base64 Encoder/Decoder ✅
Encode and decode Base64 strings with support for both text and files.

**Features:**
- Text to Base64 encoding with UTF-8 support
- Base64 to text decoding with validation
- File to Base64 conversion for any file type
- Base64 to file download functionality
- Size analysis and format validation
- Batch processing support

### 4. URL Encoder/Decoder ✅
Comprehensive URL encoding/decoding with parsing and building tools.

**Features:**
- Full URL encoding/decoding (encodeURI/decodeURI)
- URL component encoding (encodeURIComponent)
- URL parser showing protocol, hostname, path, query parameters
- Query string builder with key-value management
- Real-time validation and error handling
- Copy and export functionality

### 5. Hash Generator ✅
Generate cryptographic hash values for text and files using multiple algorithms.

**Features:**
- Multiple hash algorithms: MD5, SHA-1, SHA-256, SHA-512
- Text and file input support
- Algorithm selection and comparison
- Hash verification and validation
- File size analysis and processing
- Security recommendations for algorithm selection

### 6. Regex Tester 🚧
Test regular expressions with real-time matching and group extraction.

**Features (Coming Soon):**
- Pattern testing with real-time feedback
- Match highlighting and group extraction
- Common regex patterns library
- Replace functionality with preview
- Performance analysis for complex patterns

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Rust (latest stable)
- Tauri CLI

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd toolbox

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development
```bash
# Run in development mode
npm run dev

# Build the application
npm run build

# Run Tauri development mode
npm run tauri dev
```

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Tauri (Rust)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components

## 📁 Project Structure

```
toolbox/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui v2 components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   ├── Base64Tool.tsx   # Base64 encoder/decoder
│   │   ├── HashGenerator.tsx # Hash generation tool
│   │   ├── Home.tsx         # Tool hub interface
│   │   ├── JsonFormatter.tsx # JSON formatter tool
│   │   ├── LogViewer.tsx    # Log viewer with table interface
│   │   ├── ToolLayout.tsx   # Shared tool layout wrapper
│   │   └── UrlTool.tsx      # URL encoder/decoder
│   ├── pages/               # Tool page wrappers
│   │   ├── Base64ToolPage.tsx
│   │   ├── HashGeneratorPage.tsx
│   │   ├── JsonFormatterPage.tsx
│   │   ├── LogViewerPage.tsx
│   │   └── UrlToolPage.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions
│   ├── App.tsx              # Main application with routing
│   └── main.tsx             # Entry point
├── src-tauri/               # Tauri backend
└── public/                  # Static assets
```

## 🎨 UI Components

Built with [shadcn/ui v2](https://ui.shadcn.com/) for consistent, accessible components:
- **Card layouts** for tool organization and content grouping
- **Table components** for structured data display
- **Badge system** for status indicators and categorization
- **Button variants** for different interaction types
- **Input components** with validation and formatting
- **Separator elements** for visual content organization
- **Responsive design** with Tailwind CSS
- **Modern animations** and hover effects
- **Keyboard shortcuts** support throughout

## 🔧 Technologies Used

- **Tauri 2.0**: Cross-platform desktop app framework
- **React 18**: Frontend framework with modern hooks
- **TypeScript 5**: Type safety and enhanced development experience
- **Tailwind CSS 3**: Utility-first CSS framework
- **shadcn/ui v2**: Modern, accessible UI component system
- **Vite 6**: Lightning-fast build tool and development server
- **React Router 7**: Client-side routing for navigation
- **Web Crypto API**: Native browser cryptography for hash generation
- **File API**: Browser-native file processing capabilities

## 📋 Roadmap

### ✅ Completed
- [x] Log Viewer with table interface and expandable rows
- [x] JSON Formatter with validation and compression analysis
- [x] Base64 Encoder/Decoder with file support
- [x] URL Encoder/Decoder with parsing tools
- [x] Hash Generator with multiple algorithms

### 🚧 In Progress
- [ ] Regex Tester with pattern library
- [ ] Color Picker with format conversion
- [ ] Timestamp Converter with timezone support

### 🎯 Planned Features
- [ ] Export functionality for all tools
- [ ] Dark/Light theme toggle
- [ ] Tool history and favorites
- [ ] Bulk processing capabilities
- [ ] Plugin system for custom tools
- [ ] Advanced search and filtering
- [ ] Tool chaining and workflows

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.# toolbox
