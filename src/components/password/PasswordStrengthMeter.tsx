import { usePasswordStrength } from '@/hooks/usePasswordStrength';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { strength, isLoading, getStrengthLabel, getStrengthColor } = usePasswordStrength(password);

  if (!password || isLoading) return null;

  if (!strength) return null;

  const progressValue = (strength.score / 4) * 100;
  const strengthLabel = getStrengthLabel(strength.score);
  const strengthColor = getStrengthColor(strength.score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength:</span>
        <span 
          className="font-medium"
          style={{ color: strengthColor }}
        >
          {strengthLabel}
        </span>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
        style={{
          '--progress-foreground': strengthColor
        } as React.CSSProperties}
      />

      {strength.feedback.warning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{strength.feedback.warning}</AlertDescription>
        </Alert>
      )}

      {strength.feedback.suggestions.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Suggestions:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {strength.feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {strength.score >= 3 && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Strong password! Time to crack: {strength.crack_times_display.offline_slow_hashing_1e4_per_second}</span>
        </div>
      )}
    </div>
  );
}