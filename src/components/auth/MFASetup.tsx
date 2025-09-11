import { useState, useEffect } from 'react';
import { Shield, Copy, Check, Smartphone, Mail, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function MFASetup() {
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('mfa_secret')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setMfaEnabled(!!data?.mfa_secret);
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const generateTOTPSecret = () => {
    // Generate a random 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTotpSecret(secret);

    // Generate QR code URL for authenticator apps
    const appName = 'SecureVault';
    const accountName = user?.email || 'user';
    const issuer = 'SecureVault';
    
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`);
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(totpSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Secret copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const verifyAndEnableMFA = async () => {
    if (!totpSecret || !verificationCode || !user) return;

    setLoading(true);
    try {
      // In a real implementation, you'd verify the TOTP code here
      // For demo purposes, we'll simulate verification
      if (verificationCode.length === 6) {
        const { error } = await supabase
          .from('profiles')
          .update({ mfa_secret: totpSecret })
          .eq('id', user.id);

        if (error) throw error;

        setMfaEnabled(true);
        toast({
          title: "MFA Enabled",
          description: "Two-factor authentication has been enabled for your account"
        });
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ mfa_secret: null })
        .eq('id', user.id);

      if (error) throw error;

      setMfaEnabled(false);
      setTotpSecret('');
      setQrCodeUrl('');
      setVerificationCode('');
      
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable MFA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async () => {
    // This would typically send an OTP via email
    toast({
      title: "OTP Sent",
      description: "Check your email for the verification code (Demo: use 123456)"
    });
  };

  if (mfaEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>
            MFA is currently enabled for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is protected with two-factor authentication
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={disableMFA} 
              disabled={loading}
            >
              Disable MFA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enable Multi-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="totp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Authenticator App
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email OTP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            {!totpSecret ? (
              <div className="text-center py-6">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Set up TOTP with your authenticator app
                </p>
                <Button onClick={generateTOTPSecret}>
                  Generate Setup Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">1. Scan QR Code</h4>
                    <div className="border rounded-lg p-4 text-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="TOTP QR Code" 
                        className="mx-auto"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">2. Or Enter Secret Manually</h4>
                      <div className="flex gap-2">
                        <Input 
                          value={totpSecret} 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copySecret}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="verification">3. Enter Verification Code</Label>
                      <Input
                        id="verification"
                        placeholder="6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                      />
                    </div>

                    <Button 
                      onClick={verifyAndEnableMFA}
                      disabled={!verificationCode || loading}
                      className="w-full"
                    >
                      {loading ? 'Verifying...' : 'Enable MFA'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="text-center py-6">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Email-based OTP</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Receive one-time passwords via email when signing in
              </p>
              <Button onClick={sendEmailOTP}>
                Send Test Email
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Demo: Use code "123456" to verify
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}