import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'coming-soon';
}

const tools: Tool[] = [
  {
    id: 'log-viewer',
    title: 'Log Viewer',
    description: 'Parse and visualize structured log messages with syntax highlighting and proper formatting.',
    icon: '📋',
    status: 'available'
  },
  {
    id: 'json-formatter',
    title: 'JSON Formatter',
    description: 'Format, validate, and prettify JSON data with syntax highlighting.',
    icon: '🔧',
    status: 'available'
  },
  {
    id: 'base64-encoder',
    title: 'Base64 Encoder/Decoder',
    description: 'Encode and decode Base64 strings with support for files and text.',
    icon: '🔒',
    status: 'available'
  },
  {
    id: 'url-encoder',
    title: 'URL Encoder/Decoder',
    description: 'Encode and decode URL components and query parameters.',
    icon: '🌐',
    status: 'available'
  },
  {
    id: 'hash-generator',
    title: 'Hash Generator',
    description: 'Generate MD5, SHA1, SHA256, and other hash values for text and files.',
    icon: '🔐',
    status: 'available'
  },
  {
    id: 'disk-lens', // This will be part of the URL: /tools/disk-lens
    title: 'Disk Lens',
    description: 'Analyze disk space usage, find large files and folders, and help with cleanup.',
    icon: '💾', // Example icon, can be changed
    status: 'available'
  },
  {
    id: 'regex-tester',
    title: 'Regex Tester',
    description: 'Test regular expressions with real-time matching and group extraction.',
    icon: '🎯',
    status: 'coming-soon'
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleToolClick = (tool: Tool) => {
    if (tool.status === 'available') {
      navigate(`/tools/${tool.id}`);
    }
  };

  const openToolInNewWindow = async (tool: Tool) => {
    if (tool.status === 'available') {
      // For web browsers, open in new tab
      if (typeof window !== 'undefined' && !(window as any).__TAURI__) {
        window.open(`/tools/${tool.id}`, '_blank');
      } else {
        // For Tauri, use window.open or navigate to the tool
        // We'll implement proper Tauri window management later
        navigate(`/tools/${tool.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="space-y-4">
            <Badge variant="outline" className="text-sm px-4 py-1">
              Developer Tools
            </Badge>
            <h1 className="text-6xl font-bold text-foreground tracking-tight">Developer Toolbox</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Essential tools for developers. Each tool opens in its own dedicated workspace for better workflow management.
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card 
              key={tool.id} 
              className={`group transition-all duration-300 ${
                tool.status === 'available' 
                  ? 'hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer border-border' 
                  : 'opacity-60 border-dashed'
              }`}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl transition-transform group-hover:scale-110">
                      {tool.icon}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      {tool.status === 'coming-soon' && (
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                      {tool.status === 'available' && (
                        <Badge variant="default" className="text-xs">
                          Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </CardDescription>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleToolClick(tool)}
                    disabled={tool.status !== 'available'}
                    className="flex-1"
                    variant={tool.status === 'available' ? 'default' : 'secondary'}
                  >
                    {tool.status === 'available' ? 'Launch Tool' : 'Coming Soon'}
                  </Button>
                  {tool.status === 'available' && (
                    <Button
                      onClick={() => openToolInNewWindow(tool)}
                      variant="outline"
                      size="default"
                      title="Open in new window"
                      className="px-4"
                    >
                      ↗
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <Badge variant="default" className="text-2xl font-bold px-4 py-2">
                    {tools.filter(t => t.status === 'available').length}
                  </Badge>
                  <div className="text-sm text-muted-foreground font-medium">Available Tools</div>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-2xl font-bold px-4 py-2">
                    {tools.filter(t => t.status === 'coming-soon').length}
                  </Badge>
                  <div className="text-sm text-muted-foreground font-medium">Coming Soon</div>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-2xl font-bold px-4 py-2">
                    {tools.length}
                  </Badge>
                  <div className="text-sm text-muted-foreground font-medium">Total Tools</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-dashed">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Built with ❤️ for developers • Open source and extensible
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;