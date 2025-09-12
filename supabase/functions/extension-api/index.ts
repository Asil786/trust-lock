// Browser Extension API endpoints for SecureVault
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface ExtensionRequest {
  action: 'search' | 'get' | 'save' | 'verify';
  domain?: string;
  url?: string;
  entry?: any;
  extensionKey?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, domain, url, entry }: ExtensionRequest = await req.json();

    switch (action) {
      case 'search':
        // Search for entries matching the domain
        if (!domain) {
          return new Response(
            JSON.stringify({ error: 'Domain is required for search' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: entries, error: searchError } = await supabase
          .from('vault_entries')
          .select('id, metadata')
          .eq('user_id', user.id);

        if (searchError) {
          throw searchError;
        }

        // Filter entries by domain (would need to decrypt and check URLs in a real implementation)
        const matchingEntries = entries?.filter(entry => {
          // In a real implementation, you'd decrypt the metadata and check the URL
          // For now, return a mock response
          return true;
        }) || [];

        return new Response(
          JSON.stringify({
            success: true,
            entries: matchingEntries.map(e => ({
              id: e.id,
              // In real implementation, return decrypted title and username only
              title: 'Demo Entry',
              username: 'demo@example.com'
            }))
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        // Get specific entry details for autofill
        const entryId = url; // Using url parameter as entry ID for simplicity
        if (!entryId) {
          return new Response(
            JSON.stringify({ error: 'Entry ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: entryData, error: getError } = await supabase
          .from('vault_entries')
          .select('*')
          .eq('id', entryId)
          .eq('user_id', user.id)
          .single();

        if (getError) {
          throw getError;
        }

        // In a real implementation, decrypt the entry data here
        return new Response(
          JSON.stringify({
            success: true,
            entry: {
              id: entryData.id,
              username: 'demo@example.com', // Decrypted username
              password: '••••••••••••', // Encrypted password for security
              url: 'https://example.com' // Decrypted URL
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'save':
        // Save new entry from extension
        if (!entry) {
          return new Response(
            JSON.stringify({ error: 'Entry data is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // In a real implementation, encrypt the entry data here
        const { data: newEntry, error: saveError } = await supabase
          .from('vault_entries')
          .insert({
            user_id: user.id,
            encrypted_data: JSON.stringify(entry), // Would be properly encrypted
            iv: 'demo_iv', // Would be real IV
            metadata: { source: 'extension' }
          })
          .select()
          .single();

        if (saveError) {
          throw saveError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            entryId: newEntry.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'verify':
        // Verify extension connection
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: user.id,
              email: user.email
            },
            capabilities: ['search', 'autofill', 'save', 'generate']
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('Extension API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Check function logs for more details'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);