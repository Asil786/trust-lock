import { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crack_times_display: {
    offline_slow_hashing_1e4_per_second: string | number;
    offline_fast_hashing_1e10_per_second: string | number;
    online_no_throttling_10_per_second: string | number;
    online_throttling_100_per_hour: string | number;
  };
  guesses: number;
}

export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!password) {
      setStrength(null);
      return;
    }

    setIsLoading(true);
    
    // Debounce password strength calculation
    const timer = setTimeout(() => {
      try {
        const result = zxcvbn(password);
        setStrength({
          score: result.score,
          feedback: result.feedback,
          crack_times_display: result.crack_times_display,
          guesses: result.guesses
        });
      } catch (error) {
        console.error('Error calculating password strength:', error);
        setStrength(null);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [password]);

  const getStrengthLabel = (score: number): string => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'Unknown';
    }
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0: return 'hsl(var(--destructive))';
      case 1: return 'hsl(12 100% 50%)'; // Orange
      case 2: return 'hsl(45 100% 50%)'; // Yellow
      case 3: return 'hsl(120 60% 50%)'; // Light green
      case 4: return 'hsl(120 100% 25%)'; // Dark green
      default: return 'hsl(var(--muted))';
    }
  };

  return {
    strength,
    isLoading,
    getStrengthLabel,
    getStrengthColor
  };
}