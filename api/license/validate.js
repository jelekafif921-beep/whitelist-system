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

    // Test response - replace with actual Supabase check
    return res.status(200).json({
      valid: true,
      test: true,
      message: 'API ready. Add Supabase credentials in environment variables.',
      received_key: license_key.substring(0, 8) + '...' // Show partial key for security
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      note: 'Check if Supabase environment variables are set'
    });
  }
}
