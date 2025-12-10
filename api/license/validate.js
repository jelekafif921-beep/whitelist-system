import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { license_key, hwid } = req.body

  if (!license_key) {
    return res.status(400).json({ error: 'License key is required' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    // Check if license exists and is valid
    const { data: license, error } = await supabase
      .from('licenses')
      .select(`
        *,
        products (name, script_url),
        customers (roblox_user_id, roblox_username)
      `)
      .eq('license_key', license_key)
      .eq('is_active', true)
      .single()

    if (error || !license) {
      return res.status(404).json({ 
        valid: false, 
        error: 'License not found or inactive' 
      })
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(410).json({ 
        valid: false, 
        error: 'License has expired' 
      })
    }

    // Check HWID if required
    if (license.hwid && hwid !== license.hwid) {
      return res.status(403).json({ 
        valid: false, 
        error: 'License is bound to another machine' 
      })
    }

    // Add to whitelist if HWID provided
    if (hwid) {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const userAgent = req.headers['user-agent']

      await supabase.rpc('add_to_whitelist', {
        p_license_id: license.id,
        p_ip_address: ip,
        p_user_agent: userAgent,
        p_device_fingerprint: hwid
      })
    }

    return res.status(200).json({
      valid: true,
      license: {
        product: license.products.name,
        script_url: license.products.script_url,
        customer: license.customers,
        expires_at: license.expires_at
      }
    })

  } catch (error) {
    console.error('Validation error:', error)
    return res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    })
  }
}
