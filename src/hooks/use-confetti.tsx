'use client';

import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import Confetti from 'react-confetti';

type ConfettiContextType = {
  showConfetti: (shouldShow: boolean) => void;
};

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
};

export const ConfettiProvider = ({ children }: { children: React.ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [colors, setColors] = useState(['#FFFFFF']);

  const showConfetti = useCallback((shouldShow: boolean) => {
    if (shouldShow) {
      // Get accent color from CSS variables when confetti is triggered
      const accentColorValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim();
      const [h, s, l] = accentColorValue.split(' ').map(parseFloat);
      const hslColor = `hsl(${h}, ${s}%, ${l}%)`;
      setColors(['#FFFFFF', hslColor]);
    }
    setIsRunning(shouldShow);
  }, []);

  const contextValue = useMemo(() => ({ showConfetti }), [showConfetti]);

  return (
    <ConfettiContext.Provider value={contextValue}>
      {children}
      {isRunning && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10000}
          onConfettiComplete={() => setIsRunning(false)}
          style={{ zIndex: 9999 }}
          colors={colors}
        />
      )}
    </ConfettiContext.Provider>
  );
};
