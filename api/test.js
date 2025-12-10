import { createClient } from '@supabase/supabase-js';

export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
