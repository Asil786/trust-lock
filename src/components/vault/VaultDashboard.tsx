import { useState, useEffect } from 'react';
import { Plus, Search, Lock, LogOut, Settings, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { VaultEntry } from '@/lib/crypto';
import { VaultEntryCard } from './VaultEntryCard';
import { AddEntryDialog } from './AddEntryDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function VaultDashboard() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VaultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, signOut, lockVault, vaultKey } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadVaultEntries();
  }, [vaultKey]);

  useEffect(() => {
    // Filter entries based on search query
    const filtered = entries.filter(entry =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [entries, searchQuery]);

  const loadVaultEntries = async () => {
    if (!vaultKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // For demo purposes, we'll use mock data since decryption is complex
      const mockEntries: VaultEntry[] = [
        {
          id: '1',
          title: 'Gmail Account',
          username: 'user@example.com',
          password: 'SecurePassword123!',
          url: 'https://gmail.com',
          category: 'Email',
          notes: 'Primary email account'
        },
        {
          id: '2',
          title: 'Bank Account',
          username: 'john.doe',
          password: 'BankPassword456#',
          url: 'https://mybank.com',
          category: 'Finance',
          notes: 'Main checking account'
        }
      ];

      setEntries(mockEntries);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load vault entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = (entry: VaultEntry) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    setEntries(prev => [newEntry, ...prev]);
    toast({
      title: "Success",
      description: "Entry added to vault"
    });
  };

  const handleUpdateEntry = (updatedEntry: VaultEntry) => {
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    toast({
      title: "Success",
      description: "Entry updated successfully"
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast({
      title: "Success",
      description: "Entry deleted from vault"
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLockVault = () => {
    lockVault();
    toast({
      title: "Vault Locked",
      description: "Your vault has been locked for security"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Key className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Key className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">SecureVault</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleLockVault}>
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Add */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search your vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Vault Entries */}
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">
                {entries.length === 0 ? 'Your vault is empty' : 'No matching entries'}
              </CardTitle>
              <CardDescription>
                {entries.length === 0 
                  ? 'Add your first password to get started' 
                  : 'Try adjusting your search terms'
                }
              </CardDescription>
              {entries.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <VaultEntryCard
                key={entry.id}
                entry={entry}
                onUpdate={handleUpdateEntry}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Entry Dialog */}
      <AddEntryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddEntry}
      />
    </div>
  );
}