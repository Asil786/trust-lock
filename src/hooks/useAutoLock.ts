import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useAutoLock(timeoutMinutes: number = 15) {
  const [isLocked, setIsLocked] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const { lockVault } = useAuth();

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    if (timeSinceLastActivity >= timeoutMs && !isLocked) {
      setIsLocked(true);
      lockVault();
    }
  }, [lastActivity, timeoutMinutes, isLocked, lockVault]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (isLocked) return;
      resetActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [resetActivity, isLocked]);

  useEffect(() => {
    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkInactivity]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetActivity();
  }, [resetActivity]);

  return {
    isLocked,
    unlock,
    resetActivity,
    timeUntilLock: Math.max(0, (timeoutMinutes * 60 * 1000) - (Date.now() - lastActivity))
  };
}