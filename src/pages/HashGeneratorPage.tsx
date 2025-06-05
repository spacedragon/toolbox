import React from 'react';
import ToolLayout from '@/components/ToolLayout';
import HashGenerator from '@/components/HashGenerator';

const HashGeneratorPage: React.FC = () => {
  return (
    <ToolLayout
      toolName="Hash Generator"
      description="Generate MD5, SHA1, SHA256, and SHA512 hash values for text and files"
    >
      <HashGenerator />
    </ToolLayout>
  );
};

export default HashGeneratorPage;