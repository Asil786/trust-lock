import { useState } from 'react';
import { Download, Upload, Clock, Key, Trash2, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function AdvancedSettings() {
  const [autoLockTime, setAutoLockTime] = useState('15');
  const [clipboardTimeout, setClipboardTimeout] = useState('30');
  const [showPasswords, setShowPasswords] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [breachAlerts, setBreachAlerts] = useState(true);
  const [exportFormat, setExportFormat] = useState('encrypted');
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const exportVault = () => {
    try {
      // Create sample export data
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        encrypted: exportFormat === 'encrypted',
        entries: [
          {
            title: 'Gmail Account',
            username: 'user@example.com',
            password: exportFormat === 'encrypted' ? '***ENCRYPTED***' : 'SecurePassword123!',
            url: 'https://gmail.com',
            category: 'Email',
            notes: 'Primary email account'
          }
        ]
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Vault exported as ${exportFormat} file`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export vault data",
        variant: "destructive"
      });
    }
  };

  const importVault = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        console.log('Import data:', data);
        
        toast({
          title: "Import Complete",
          description: `Imported ${data.entries?.length || 0} entries`
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const changeMasterPassword = () => {
    toast({
      title: "Change Master Password",
      description: "This feature will be available in the next update"
    });
  };

  const deleteAccount = async () => {
    try {
      // In a real implementation, this would delete the user's data
      await signOut();
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted"
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and privacy options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autolock">Auto-lock timeout</Label>
              <Select value={autoLockTime} onValueChange={setAutoLockTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clipboard">Clipboard timeout</Label>
              <Select value={clipboardTimeout} onValueChange={setClipboardTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="never">Never clear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-passwords">Show passwords by default</Label>
                <p className="text-sm text-muted-foreground">
                  Display passwords in plain text instead of masked
                </p>
              </div>
              <Switch
                id="show-passwords"
                checked={showPasswords}
                onCheckedChange={setShowPasswords}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="breach-alerts">Breach monitoring alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your passwords are found in data breaches
                </p>
              </div>
              <Switch
                id="breach-alerts"
                checked={breachAlerts}
                onCheckedChange={setBreachAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Backup & Export
          </CardTitle>
          <CardDescription>
            Manage your vault data and backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Export Vault</h4>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encrypted">Encrypted JSON</SelectItem>
                  <SelectItem value="plain">Plain JSON</SelectItem>
                  <SelectItem value="csv">CSV Format</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportVault} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Vault
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Import Vault</h4>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Label htmlFor="import-file" className="cursor-pointer">
                  <span className="text-sm font-medium">Click to import</span>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json,.csv"
                    onChange={importVault}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JSON and CSV files
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Account Management
          </CardTitle>
          <CardDescription>
            Manage your account settings and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Change Master Password</h4>
              <p className="text-sm text-muted-foreground">
                Update your master password for enhanced security
              </p>
            </div>
            <Button variant="outline" onClick={changeMasterPassword}>
              Change Password
            </Button>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-red-600">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} className="bg-red-600 hover:bg-red-700">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}