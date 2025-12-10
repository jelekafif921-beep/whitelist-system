import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

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
    const { product_id, customer_id, expires_days, hwid } = req.body;
    
    if (!product_id || !customer_id) {
      return res.status(400).json({ 
        error: 'product_id and customer_id are required' 
      });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Server configuration error' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate unique license key
    const licenseKey = randomBytes(16).toString('hex').toUpperCase();

    // Calculate expiry date if provided
    let expires_at = null;
    if (expires_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expires_days));
      expires_at = expiryDate.toISOString();
    }

    // Insert into database
    const { data: license, error } = await supabase
      .from('licenses')
      .insert([{
        license_key: licenseKey,
        product_id: product_id,
        customer_id: customer_id,
        hwid: hwid || null,
        expires_at: expires_at,
        is_active: true
      }])
      .select(`
        *,
        products (name, price),
        customers (roblox_username, email)
      `)
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      license_key: licenseKey,
      license: license,
      instructions: 'Give this key to the buyer. They will add it to their script.'
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
