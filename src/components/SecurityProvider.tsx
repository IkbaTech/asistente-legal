import React, { useEffect, ReactNode } from 'react';
import { setupCSP, setupSecurityHeaders } from '../utils/contentSecurityPolicy';

interface SecurityProviderProps {
  children: ReactNode;
}

const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize security policies when component mounts
    setupCSP();
    setupSecurityHeaders();
  }, []);

  return <>{children}</>;
};

export default SecurityProvider;