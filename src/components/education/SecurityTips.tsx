import { useState } from 'react';
import { X, Lightbulb, Shield, Key, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SecurityTip {
  id: string;
  title: string;
  content: string;
  type: 'password' | 'security' | 'privacy' | 'habits';
  icon: React.ReactNode;
  color: string;
}

const securityTips: SecurityTip[] = [
  {
    id: 'unique-passwords',
    title: 'Use Unique Passwords',
    content: 'Every account should have a different password. If one gets compromised, others stay safe.',
    type: 'password',
    icon: <Key className="h-4 w-4" />,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    id: 'length-matters',
    title: 'Length Matters More',
    content: 'A 15-character password with mixed cases is stronger than an 8-character password with symbols.',
    type: 'password',
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    id: 'regular-updates',
    title: 'Regular Password Updates',
    content: 'Update passwords for critical accounts every 3-6 months, especially for financial services.',
    type: 'habits',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  {
    id: 'phishing-awareness',
    title: 'Beware of Phishing',
    content: 'Always verify the URL before entering passwords. Look for HTTPS and correct domain spelling.',
    type: 'security',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  }
];

interface SecurityTipsProps {
  currentContext?: 'password-creation' | 'login' | 'vault' | 'general';
}

export function SecurityTips({ currentContext = 'general' }: SecurityTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const getContextualTips = () => {
    switch (currentContext) {
      case 'password-creation':
        return securityTips.filter(tip => tip.type === 'password');
      case 'login':
        return securityTips.filter(tip => tip.type === 'security');
      case 'vault':
        return securityTips.filter(tip => tip.type === 'habits');
      default:
        return securityTips;
    }
  };

  const availableTips = getContextualTips().filter(tip => !dismissedTips.includes(tip.id));
  
  if (availableTips.length === 0) return null;

  const currentTip = availableTips[currentTipIndex % availableTips.length];

  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => [...prev, tipId]);
    if (currentTipIndex >= availableTips.length - 1) {
      setCurrentTipIndex(0);
    }
  };

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % availableTips.length);
  };

  return (
    <Card className={`border-2 transition-all duration-300 ${currentTip.color}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="p-1.5 rounded-full bg-white/50">
              {currentTip.icon}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium text-sm">Security Tip</span>
              <Badge variant="outline" className="text-xs">
                {currentTip.type}
              </Badge>
            </div>
            
            <h4 className="font-semibold text-sm mb-1">{currentTip.title}</h4>
            <p className="text-sm opacity-90 leading-relaxed">{currentTip.content}</p>
            
            {availableTips.length > 1 && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextTip}
                  className="h-7 px-2 text-xs"
                >
                  Next Tip
                </Button>
                <span className="text-xs opacity-70">
                  {currentTipIndex + 1} of {availableTips.length}
                </span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissTip(currentTip.id)}
            className="flex-shrink-0 h-6 w-6 p-0 opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}