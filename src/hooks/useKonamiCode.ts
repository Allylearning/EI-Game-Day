
'use client';

import { useState, useEffect, useCallback } from 'react';

// The famous Konami Code sequence
const konamiCode = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
];

/**
 * A custom hook that listens for the Konami Code.
 * @returns {boolean} - True if the code has been successfully entered, otherwise false.
 */
export const useKonamiCode = (): boolean => {
  const [keys, setKeys] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const keydownHandler = useCallback((e: KeyboardEvent) => {
    // If the code has already been entered, do nothing.
    if (success) return;

    // Add the pressed key to our array.
    const newKeys = [...keys, e.key];

    // Check if the sequence so far matches the start of the Konami code.
    for (let i = 0; i < newKeys.length; i++) {
      if (newKeys[i] !== konamiCode[i]) {
        // If it doesn't match, reset the sequence.
        setKeys([]);
        return;
      }
    }

    // If the sequence matches the full code, we have success!
    if (newKeys.length === konamiCode.length) {
      setSuccess(true);
    }
    
    // Update the sequence.
    setKeys(newKeys);

  }, [keys, success]);

  useEffect(() => {
    window.addEventListener('keydown', keydownHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
    };
  }, [keydownHandler]);

  return success;
};
