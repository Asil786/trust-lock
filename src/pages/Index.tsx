import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { VaultUnlock } from '@/components/vault/VaultUnlock';
import { VaultDashboard } from '@/components/vault/VaultDashboard';

const Index = () => {
  const { user, loading, isVaultUnlocked } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if user is not signed in
  if (!user) {
    return <AuthForm />;
  }

  // Show vault unlock if user is signed in but vault is locked
  if (!isVaultUnlocked) {
    return <VaultUnlock />;
  }

  // Show dashboard if user is signed in and vault is unlocked
  return <VaultDashboard />;
};

export default Index;
