import React from 'react';
import ToolLayout from '@/components/ToolLayout';
import UrlTool from '@/components/UrlTool';

const UrlToolPage: React.FC = () => {
  return (
    <ToolLayout
      toolName="URL Encoder/Decoder"
      description="Encode and decode URL components and query parameters with URL parsing and building tools"
    >
      <UrlTool />
    </ToolLayout>
  );
};

export default UrlToolPage;