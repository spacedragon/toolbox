import React from 'react';
import ToolLayout from '@/components/ToolLayout';
import JsonFormatter from '@/components/JsonFormatter';

const JsonFormatterPage: React.FC = () => {
  return (
    <ToolLayout
      toolName="JSON Formatter"
      description="Format, validate, and prettify JSON data with syntax highlighting and compression analysis"
    >
      <JsonFormatter />
    </ToolLayout>
  );
};

export default JsonFormatterPage;