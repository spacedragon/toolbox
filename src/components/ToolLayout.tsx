import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';



interface ToolLayoutProps {
  toolName: string;
  description: string;
  children: React.ReactNode;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({ toolName, description, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto w-full p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Tool</Badge>
                  <CardTitle className="text-2xl">{toolName}</CardTitle>
                </div>
                <p className="text-muted-foreground">{description}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="sm"
                >
                  ← Back to Home
                </Button>
                <Button
                  onClick={() => window.close()}
                  variant="outline"
                  size="sm"
                  title="Close Window"
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Separator className="mb-6" />

        {/* Tool Content */}
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6 pr-4">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ToolLayout;