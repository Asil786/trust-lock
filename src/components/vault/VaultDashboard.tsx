import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Lock,
  LogOut,
  Settings,
  Key,
  Shield,
  Award,
  TrendingUp,
  Vault,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { VaultEntry } from "@/lib/crypto";
import { VaultEntryCard } from "./VaultEntryCard";
import { AddEntryDialog } from "./AddEntryDialog";
import { SecurityInsights } from "@/components/security/SecurityInsights";
import { MFASetup } from "@/components/auth/MFASetup";
import { useNavigate } from "react-router-dom";
import { AdvancedSettings } from "@/components/settings/AdvancedSettings";
import { PasswordGenerator } from "@/components/password/PasswordGenerator";
import { SecurityTips } from "@/components/education/SecurityTips";
import { SecurityChallenges } from "@/components/gamification/SecurityChallenges";
import { EducationalTooltip } from "@/components/ui/tooltip-educational";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// import { NavItem } from '@/components/ui/nav-item';

export function VaultDashboard() {
  const navigate = useNavigate();
  const { user, vaultKey } = useAuth();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("vault");
  const { toast } = useToast();
  const { isOnline, syncStatus, saveOffline, syncWithSupabase } =
    useOfflineSync();
  const { isLocked, unlock, timeUntilLock } = useAutoLock(15);

  // Show auto-lock screen if vault is locked
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Vault Locked</CardTitle>
            <CardDescription>
              Your vault was automatically locked due to inactivity for security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={unlock} className="w-full">
              Unlock Vault
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadEntries();
  }, [user, vaultKey]);

  const loadEntries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // For demo purposes, using mock data
      const mockEntries: VaultEntry[] = [
        {
          id: "1",
          title: "Gmail Account",
          username: "user@example.com",
          password: "SecurePassword123!",
          url: "https://gmail.com",
          category: "personal",
          notes: "Primary email account",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Bank Account",
          username: "john.doe",
          password: "BankPassword456#",
          url: "https://mybank.com",
          category: "finance",
          notes: "Main checking account",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          title: "University Portal",
          username: "student123",
          password: "StudyHard2024!",
          url: "https://university.edu",
          category: "education",
          notes: "Student portal access",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setEntries(mockEntries);

      // Sync with Supabase if online
      if (isOnline && user) {
        await syncWithSupabase(user.id);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
      toast({
        title: "Error",
        description: "Failed to load vault entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleEntryAdded = (entry: VaultEntry) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);

    // Save offline if needed
    if (!isOnline) {
      saveOffline(newEntry);
    }

    toast({
      title: "Success",
      description: "Password added to vault",
    });
  };

  const handleEntryUpdated = (updatedEntry: VaultEntry) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === updatedEntry.id
          ? { ...updatedEntry, updated_at: new Date().toISOString() }
          : entry
      )
    );

    // Save offline if needed
    if (!isOnline) {
      saveOffline({ ...updatedEntry, updated_at: new Date().toISOString() });
    }

    toast({
      title: "Success",
      description: "Password updated successfully",
    });
  };

  const handleEntryDeleted = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    toast({
      title: "Success",
      description: "Password deleted from vault",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SecureVault
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Offline/Online Status */}
            <EducationalTooltip
              title={isOnline ? "Online Status" : "Offline Mode"}
              content={
                isOnline
                  ? "Connected to cloud sync"
                  : "Working offline - changes will sync when connection returns"
              }
              type={isOnline ? "success" : "warning"}
            >
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  isOnline
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-success" : "bg-warning"
                  } ${isOnline ? "animate-pulse-glow" : ""}`}
                />
                {isOnline ? "Online" : "Offline"}
              </div>
            </EducationalTooltip>
            <div
              className="text-xs text-muted-foreground"
              onClick={() => navigate("/chatbot")}
            >
              <span>Live Bot</span>
            </div>
        
            <span className="text-xs text-muted-foreground">
              <a href="https://secure-vaults-six.vercel.app/dashboard">
                Agents
              </a>
            </span>
            {/* Auto-lock timer */}
            {timeUntilLock > 0 && (
              <EducationalTooltip
                title="Auto-lock Timer"
                content="Vault will automatically lock after 15 minutes of inactivity for security"
                type="security"
              >
                <div className="text-xs text-muted-foreground">
                  Locks in {Math.ceil(timeUntilLock / 60000)}m
                </div>
              </EducationalTooltip>
            )}

            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, {user?.email}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Educational Security Tips Banner */}
        <SecurityTips currentContext="vault" />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
              <TabsTrigger
                value="vault"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Vault className="h-4 w-4" />
                <span className="hidden xs:inline">Vault</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden xs:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="mfa"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden xs:inline">MFA</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Sync Status */}
            {syncStatus === "syncing" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Syncing...
              </div>
            )}
          </div>

          <TabsContent value="vault" className="space-y-6">
            {/* Search and filters */}
            <Card className="shadow-elegant">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <EducationalTooltip
                        title="Search Your Vault"
                        content="Search by title, username, URL, or notes. Use specific keywords to find passwords quickly."
                        type="info"
                      >
                        <Input
                          placeholder="Search passwords..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full transition-all duration-300 focus:shadow-glow"
                        />
                      </EducationalTooltip>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      <EducationalTooltip
                        title="Add New Password"
                        content="Create strong, unique passwords for each account. Our generator helps create secure passwords."
                        type="security"
                        showBadge
                      >
                        <AddEntryDialog onEntryAdded={handleEntryAdded} />
                      </EducationalTooltip>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">
                        {entries.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Passwords
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-success">
                        {entries.filter((e) => e.category === "finance").length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Financial
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-info">
                        {entries.filter((e) => e.category === "work").length}
                      </div>
                      <div className="text-xs text-muted-foreground">Work</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-warning">
                        {entries.filter((e) => e.category === "social").length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Social
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password entries */}
            {filteredEntries.length === 0 ? (
              <Card className="shadow-elegant">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Vault className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No passwords found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {entries.length === 0
                        ? "Start by adding your first password to the vault"
                        : "No passwords match your search criteria"}
                    </p>
                    {entries.length === 0 && (
                      <div className="space-y-4">
                        <AddEntryDialog onEntryAdded={handleEntryAdded} />
                        <div className="text-sm text-muted-foreground">
                          💡 Tip: Use our password generator to create strong,
                          unique passwords
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEntries.map((entry) => (
                  <VaultEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={handleEntryUpdated}
                    onDelete={handleEntryDeleted}
                  />
                ))}
              </div>
            )}

            {/* Password Generator Section */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Generator
                </CardTitle>
                <CardDescription>
                  Generate strong, unique passwords for your accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordGenerator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityInsights entries={entries} />
            <SecurityChallenges vaultEntries={entries} />
          </TabsContent>

          <TabsContent value="mfa">
            <MFASetup />
          </TabsContent>

          <TabsContent value="settings">
            <AdvancedSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
