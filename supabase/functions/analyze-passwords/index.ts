import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordAnalysisRequest {
  passwords: { id: string; password: string; url?: string; title: string }[];
}

interface PasswordIssue {
  type: 'weak' | 'reused' | 'old' | 'common';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  entryIds: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passwords }: PasswordAnalysisRequest = await req.json();
    
    console.log(`Analyzing ${passwords.length} passwords`);

    const issues: PasswordIssue[] = [];
    const passwordMap = new Map<string, string[]>();
    const commonPasswords = new Set([
      'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon'
    ]);

    // Check for reused passwords
    passwords.forEach(({ id, password }) => {
      if (!passwordMap.has(password)) {
        passwordMap.set(password, []);
      }
      passwordMap.get(password)!.push(id);
    });

    passwordMap.forEach((entryIds, password) => {
      if (entryIds.length > 1) {
        issues.push({
          type: 'reused',
          severity: 'high',
          message: `Password is reused across ${entryIds.length} accounts`,
          entryIds
        });
      }
    });

    // Check individual password strength
    passwords.forEach(({ id, password, title }) => {
      // Check if password is too common
      if (commonPasswords.has(password.toLowerCase())) {
        issues.push({
          type: 'common',
          severity: 'critical',
          message: `"${title}" uses a very common password`,
          entryIds: [id]
        });
        return;
      }

      // Check password strength
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      if (score < 3) {
        issues.push({
          type: 'weak',
          severity: score < 2 ? 'critical' : 'high',
          message: `"${title}" has a weak password (${score}/6 strength)`,
          entryIds: [id]
        });
      }
    });

    // Calculate overall security score
    const totalPasswords = passwords.length;
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    let securityScore = 100;
    securityScore -= (criticalIssues * 20);
    securityScore -= (highIssues * 10);
    securityScore -= (mediumIssues * 5);
    securityScore = Math.max(0, securityScore);

    // Generate recommendations
    const recommendations = [];
    if (criticalIssues > 0) {
      recommendations.push("Immediately replace common and very weak passwords");
    }
    if (issues.filter(i => i.type === 'reused').length > 0) {
      recommendations.push("Use unique passwords for each account");
    }
    if (issues.filter(i => i.type === 'weak').length > 0) {
      recommendations.push("Strengthen weak passwords with longer length and mixed characters");
    }
    if (securityScore > 80) {
      recommendations.push("Great job! Your password security is excellent");
    }

    return new Response(
      JSON.stringify({
        securityScore,
        issues,
        recommendations,
        stats: {
          totalPasswords,
          criticalIssues,
          highIssues,
          mediumIssues,
          reusedPasswords: passwordMap.size < totalPasswords ? totalPasswords - passwordMap.size : 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-passwords function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});