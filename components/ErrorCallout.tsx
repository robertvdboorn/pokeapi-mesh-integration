import React from 'react';
import { Callout } from '@uniformdev/mesh-sdk-react';

interface ErrorCalloutProps {
  error: string;
}

export const ErrorCallout: React.FC<ErrorCalloutProps> = ({ error }) => {
  return (
    <Callout type="error">
      <p>An error occurred: {error}</p>
    </Callout>
  );
};
