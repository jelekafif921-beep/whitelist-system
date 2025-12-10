import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { product_id, customer_id, expires_at, hwid } = req.body

  if (!product_id || !customer_id) {
    return res.status(400).json({ error: 'product_id and customer_id are required' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    // Generate license key
    const licenseKey = crypto.randomBytes(16).toString('hex').toUpperCase()

    // Create license
    const { data, error } = await supabase
      .from('licenses')
      .insert([
        {
          license_key: licenseKey,
          product_id,
          customer_id,
          hwid: hwid || null,
          expires_at: expires_at || null
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return res.status(201).json({
      success: true,
      license_key: licenseKey,
      license: data
    })

  } catch (error) {
    console.error('Generation error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
