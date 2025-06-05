import React from 'react';
import ToolLayout from '@/components/ToolLayout';
import Base64Tool from '@/components/Base64Tool';

const Base64ToolPage: React.FC = () => {
  return (
    <ToolLayout
      toolName="Base64 Encoder/Decoder"
      description="Encode and decode Base64 strings with support for text and files"
    >
      <Base64Tool />
    </ToolLayout>
  );
};

export default Base64ToolPage;