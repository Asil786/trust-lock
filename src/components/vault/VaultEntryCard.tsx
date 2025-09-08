import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  MoreVertical,
  Edit,
  Trash2,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VaultEntry } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { EditEntryDialog } from './EditEntryDialog';

interface VaultEntryCardProps {
  entry: VaultEntry;
  onUpdate: (entry: VaultEntry) => void;
  onDelete: (entryId: string) => void;
}

export function VaultEntryCard({ entry, onUpdate, onDelete }: VaultEntryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'finance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'social': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'work': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      onDelete(entry.id!);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {entry.url && <Globe className="h-4 w-4 text-muted-foreground" />}
                {entry.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={getCategoryColor(entry.category)}>
                  {entry.category}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {entry.url && (
                  <DropdownMenuItem onClick={() => window.open(entry.url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open URL
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                {entry.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(entry.username, 'Username')}
                className="h-8 w-8"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Password</label>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                {showPassword ? entry.password : '••••••••'}
              </span>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(entry.password, 'Password')}
                  className="h-8 w-8"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* URL */}
          {entry.url && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">URL</label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 dark:text-blue-400 truncate">
                  {entry.url}
                </span>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(entry.url, '_blank')}
                    className="h-8 w-8"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(entry.url!, 'URL')}
                    className="h-8 w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <p className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {entry.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditEntryDialog
        entry={entry}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}