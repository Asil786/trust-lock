import { ReactNode } from 'react';
import { Info, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface EducationalTooltipProps {
  children: ReactNode;
  title: string;
  content: string;
  type?: 'info' | 'security' | 'warning' | 'success';
  showBadge?: boolean;
}

export function EducationalTooltip({ 
  children, 
  title, 
  content, 
  type = 'info',
  showBadge = false 
}: EducationalTooltipProps) {
  const getIcon = () => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'security': return 'default';
      case 'warning': return 'destructive';
      case 'success': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-flex items-center gap-2">
            {children}
            {showBadge && (
              <Badge variant={getBadgeVariant()} className="text-xs">
                Tip
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              {getIcon()}
              {title}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}