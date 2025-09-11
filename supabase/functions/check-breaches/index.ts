import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BreachCheckRequest {
  email: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId }: BreachCheckRequest = await req.json();
    
    console.log(`Checking breaches for email: ${email}`);

    // Check HaveIBeenPwned API
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: {
        'User-Agent': 'SecureVault-PasswordManager',
        'hibp-api-key': Deno.env.get('HIBP_API_KEY') || ''
      }
    });

    let breaches = [];
    let breachCount = 0;

    if (response.status === 200) {
      breaches = await response.json();
      breachCount = breaches.length;
      console.log(`Found ${breachCount} breaches for ${email}`);
    } else if (response.status === 404) {
      console.log(`No breaches found for ${email}`);
    } else {
      console.log(`HaveIBeenPwned API returned status: ${response.status}`);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store alert if breaches found
    if (breachCount > 0) {
      const alertMessage = `Security Alert: Your email ${email} was found in ${breachCount} data breach${breachCount > 1 ? 'es' : ''}. Consider changing passwords for affected services.`;
      
      await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          alert_type: 'BREACH_DETECTED',
          message: alertMessage,
          metadata: { 
            email, 
            breach_count: breachCount,
            breaches: breaches.slice(0, 5).map((b: any) => ({
              name: b.Name,
              domain: b.Domain,
              breach_date: b.BreachDate,
              data_classes: b.DataClasses
            }))
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        breachCount, 
        breaches: breaches.slice(0, 5),
        alertCreated: breachCount > 0 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-breaches function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});