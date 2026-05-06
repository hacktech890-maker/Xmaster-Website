// src/context/DisclaimerContext.jsx
// Manages 18+ disclaimer acceptance state

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isDisclaimerAccepted, acceptDisclaimer } from '../utils/helpers';
import { DISCLAIMER_ENABLED } from '../config/features';

const DisclaimerContext = createContext(null);

export const DisclaimerProvider = ({ children }) => {
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already accepted (from localStorage)
    if (!DISCLAIMER_ENABLED || isDisclaimerAccepted()) {
      setAccepted(true);
    }
    setChecking(false);
  }, []);

  const handleAccept = () => {
    acceptDisclaimer();
    setAccepted(true);
  };

  const handleExit = () => {
    // Redirect to safe page (Google)
    window.location.href = 'https://www.google.com';
  };

  return (
    <DisclaimerContext.Provider value={{
      accepted,
      checking,
      handleAccept,
      handleExit,
    }}>
      {children}
    </DisclaimerContext.Provider>
  );
};

export const useDisclaimer = () => {
  const context = useContext(DisclaimerContext);
  if (!context) {
    throw new Error('useDisclaimer must be used within DisclaimerProvider');
  }
  return context;
};

export default DisclaimerContext;