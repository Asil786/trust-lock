import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, RefreshCw, Copy } from 'lucide-react';
import { VaultEntry, generatePassword } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthMeter } from '@/components/password/PasswordStrengthMeter';

interface EditEntryDialogProps {
  entry: VaultEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (entry: VaultEntry) => void;
}

const categories = [
  'Email',
  'Finance',
  'Social',
  'Work',
  'Personal',
  'Shopping',
  'Entertainment',
  'Other'
];

export function EditEntryDialog({ entry, open, onOpenChange, onUpdate }: EditEntryDialogProps) {
  const [formData, setFormData] = useState<VaultEntry>(entry);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(entry);
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      onUpdate(formData);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(16, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true
    });
    setFormData(prev => ({ ...prev, password: newPassword }));
    toast({
      title: "Password Generated",
      description: "A strong password has been generated"
    });
  };

  const copyPassword = async () => {
    if (formData.password) {
      try {
        await navigator.clipboard.writeText(formData.password);
        toast({
          title: "Copied!",
          description: "Password copied to clipboard"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy password",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>
            Update your password entry.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Gmail Account"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-username">Username *</Label>
            <Input
              id="edit-username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Username or email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-password">Password *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter or generate password"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-8 w-8"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {formData.password && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={copyPassword}
                      className="h-8 w-8"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
            {formData.password && <PasswordStrengthMeter password={formData.password} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Updating...' : 'Update Entry'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}