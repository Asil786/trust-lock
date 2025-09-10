import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { generateSalt, hashPassword, deriveKeyFromPassword, generateVaultKey, encryptVaultKey } from '@/lib/crypto';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isVaultUnlocked: boolean;
  vaultKey: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isVaultUnlocked: false,
    vaultKey: null
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
          // Reset vault state on auth change
          isVaultUnlocked: false,
          vaultKey: null
        }));
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // Generate encryption data after successful signup
      if (data.user) {
        const salt = generateSalt();
        const hashedPassword = await hashPassword(password, salt);
        
        // Generate and encrypt vault key
        const vaultKey = generateVaultKey();
        const masterKey = await deriveKeyFromPassword(password, salt);
        const encryptedVaultKey = encryptVaultKey(vaultKey, masterKey);

        // First try to insert a new profile, if it exists update it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            argon2_hash: hashedPassword,
            salt,
            vault_key_encrypted: JSON.stringify(encryptedVaultKey)
          });

        if (insertError && insertError.code === '23505') {
          // If insert fails due to duplicate key, update the existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              argon2_hash: hashedPassword,
              salt,
              vault_key_encrypted: JSON.stringify(encryptedVaultKey)
            })
            .eq('id', data.user.id);

          if (updateError) throw updateError;
        } else if (insertError) {
          throw insertError;
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const unlockVault = async (masterPassword: string) => {
    try {
      if (!authState.user) throw new Error('User not authenticated');

      // Get user profile with vault key
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('salt, vault_key_encrypted')
        .eq('id', authState.user.id)
        .single();

      if (error) throw error;
      if (!profile) throw new Error('Profile not found');

      // Check if profile is incomplete (missing salt or vault_key_encrypted)
      if (!profile.salt || !profile.vault_key_encrypted) {
        throw new Error('Your vault is not properly initialized. Please sign out and sign up again to recreate your vault.');
      }

      // Derive master key and decrypt vault key
      const masterKey = await deriveKeyFromPassword(masterPassword, profile.salt);
      let encryptedVaultKey;
      try {
        encryptedVaultKey = JSON.parse(profile.vault_key_encrypted);
        if (!encryptedVaultKey.ciphertext) {
          throw new Error('Invalid vault data format');
        }
      } catch {
        throw new Error('Invalid vault data. Please sign out and sign up again to recreate your vault.');
      }
      
      // This would normally decrypt the vault key, but for now we'll use the master key
      const vaultKey = masterKey; // Simplified for demo

      setAuthState(prev => ({
        ...prev,
        isVaultUnlocked: true,
        vaultKey
      }));

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  };

  const lockVault = () => {
    setAuthState(prev => ({
      ...prev,
      isVaultUnlocked: false,
      vaultKey: null
    }));
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isVaultUnlocked: false,
        vaultKey: null
      });
    }
    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    unlockVault,
    lockVault
  };
}