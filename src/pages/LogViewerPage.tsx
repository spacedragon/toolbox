import React from 'react';
import ToolLayout from '@/components/ToolLayout';
import LogViewer from '@/components/LogViewer';

const LogViewerPage: React.FC = () => {
  return (
    <ToolLayout
      toolName="Log Viewer"
      description="Parse and visualize structured log messages with syntax highlighting and proper formatting"
    >
      <LogViewer />
    </ToolLayout>
  );
};

export default LogViewerPage;