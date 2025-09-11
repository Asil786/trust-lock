import { useState } from 'react';
import { RefreshCw, Copy, Check, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generatePassword } from '@/lib/crypto';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export function PasswordGenerator() {
  const [length, setLength] = useState([16]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateNewPassword = () => {
    try {
      const newPassword = generatePassword(length[0], {
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols
      });
      setPassword(newPassword);
    } catch (error: any) {
      toast({
        title: "Generation Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyPassword = async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getStrengthBadge = (password: string) => {
    if (!password) return null;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strength = score >= 5 ? 'Strong' : score >= 3 ? 'Medium' : 'Weak';
    const variant = score >= 5 ? 'default' : score >= 3 ? 'secondary' : 'destructive';
    
    return <Badge variant={variant}>{strength}</Badge>;
  };

  // Generate initial password
  useState(() => {
    generateNewPassword();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Password Generator
        </CardTitle>
        <CardDescription>
          Generate secure passwords with customizable options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generated Password */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={password}
              readOnly
              className="font-mono text-lg"
              placeholder="Click generate to create a password"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyPassword}
              disabled={!password}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateNewPassword}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            {password && <PasswordStrengthMeter password={password} />}
            {getStrengthBadge(password)}
          </div>
        </div>

        {/* Generator Options */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Password Length: {length[0]}</Label>
            <Slider
              value={length}
              onValueChange={setLength}
              min={4}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={includeUppercase}
                onCheckedChange={setIncludeUppercase}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase">Lowercase (a-z)</Label>
              <Switch
                id="lowercase"
                checked={includeLowercase}
                onCheckedChange={setIncludeLowercase}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="numbers">Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="symbols">Symbols (!@#$)</Label>
              <Switch
                id="symbols"
                checked={includeSymbols}
                onCheckedChange={setIncludeSymbols}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="exclude-similar">Exclude similar characters</Label>
              <p className="text-sm text-muted-foreground">Avoid 0, O, l, I, etc.</p>
            </div>
            <Switch
              id="exclude-similar"
              checked={excludeSimilar}
              onCheckedChange={setExcludeSimilar}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={generateNewPassword} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New
          </Button>
          <Button
            variant="outline"
            onClick={copyPassword}
            disabled={!password}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Password
          </Button>
        </div>

        {/* Password Tips */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Password Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use at least 12 characters for better security</li>
            <li>• Include a mix of uppercase, lowercase, numbers, and symbols</li>
            <li>• Avoid dictionary words and personal information</li>
            <li>• Use unique passwords for each account</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}