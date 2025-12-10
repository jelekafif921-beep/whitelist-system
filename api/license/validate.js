import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { license_key, hwid } = req.body;
    
    if (!license_key) {
      return res.status(400).json({ error: 'License key required' });
    }

    // Initialize Supabase with environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        note: 'Supabase credentials not set in environment variables' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check license in database
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        products (name, script_url),
        customers (roblox_user_id, roblox_username)
      `)
      .eq('license_key', license_key.trim())
      .eq('is_active', true)
      .single();

    if (error || !license) {
      return res.status(404).json({ 
        valid: false, 
        error: 'License not found or inactive' 
      });
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase
        .from('licenses')
        .update({ is_active: false })
        .eq('id', license.id);
      
      return res.status(410).json({ 
        valid: false, 
        error: 'License has expired' 
      });
    }

    // Check HWID binding if set
    if (license.hwid && license.hwid !== hwid) {
      return res.status(403).json({ 
        valid: false, 
        error: 'License is bound to another device' 
      });
    }

    // Record this usage in whitelist_entries
    if (hwid) {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await supabase
        .from('whitelist_entries')
        .upsert({
          license_id: license.id,
          ip_address: ip,
          user_agent: userAgent,
          device_fingerprint: hwid,
          last_used: new Date().toISOString(),
          usage_count: supabase.rpc('increment', { x: 1 })
        }, {
          onConflict: 'license_id,device_fingerprint'
        });
    }

    // SUCCESS - License is valid!
    return res.status(200).json({
      valid: true,
      license: {
        id: license.id,
        product: license.products.name,
        script_url: license.products.script_url,
        customer: license.customers,
        expires_at: license.expires_at,
        created_at: license.created_at
      },
      message: 'License validated successfully'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
